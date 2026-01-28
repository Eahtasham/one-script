import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { emailService } from '@/services/email';
import {
    users,
    accounts,
    sessions,
    verificationTokens,
    organizations,
    organizationMembers
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: {
        strategy: 'jwt',
    },
    providers: [
        ...authConfig.providers,
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                token: { label: 'Token', type: 'text' },
            },
            async authorize(credentials) {
                // Flow 1: Token Login (Verification)
                if (credentials?.token) {
                    const token = credentials.token as string;

                    const existingToken = await db.query.verificationTokens.findFirst({
                        where: eq(verificationTokens.token, token),
                    });

                    if (!existingToken) return null;

                    const hasExpired = new Date(existingToken.expires) < new Date();
                    if (hasExpired) return null;

                    const user = await db.query.users.findFirst({
                        where: eq(users.email, existingToken.identifier),
                    });

                    if (!user) return null;

                    // Update user verified status
                    await db.update(users)
                        .set({ emailVerified: new Date() })
                        .where(eq(users.id, user.id));

                    // Delete verification token
                    await db.delete(verificationTokens)
                        .where(eq(verificationTokens.token, token));

                    // Return user for session creation
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                }

                // Flow 2: Password Login
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user || !user.password) {
                    return null;
                }

                if (!user.emailVerified) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            }
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
            }

            // Load organization info on sign in
            if (trigger === 'signIn' && token.id) {
                const membership = await db.query.organizationMembers.findFirst({
                    where: eq(organizationMembers.userId, token.id as string),
                    with: { organization: true },
                });

                if (membership) {
                    token.organizationId = membership.organizationId;
                    token.role = membership.role;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id as string;
                session.user.organizationId = token.organizationId as string | undefined;
                session.user.role = token.role as 'admin' | 'member' | undefined;
            }
            return session;
        },
    },
    events: {
        async createUser({ user }) {
            // Create default organization for new users (OAuth sign-ups)
            if (user.id && user.email) {
                const orgName = user.name
                    ? `${user.name}'s Workspace`
                    : `${user.email.split('@')[0]}'s Workspace`;
                const slug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

                const [organization] = await db.insert(organizations).values({
                    name: orgName,
                    slug,
                }).returning();

                await db.insert(organizationMembers).values({
                    organizationId: organization.id,
                    userId: user.id,
                    role: 'admin',
                });

                // Send welcome email (async constraint-safe)
                if (user.name) {
                    emailService.sendWelcomeEmail(user.email, user.name).catch(console.error);
                }
            }
        },
    },
});
