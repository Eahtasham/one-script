import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { authService } from '@/services/auth-service';
import {
    users,
    accounts,
    sessions,
    verificationTokens,
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
                    return await authService.verifyLoginToken(credentials.token as string);
                }

                // Flow 2: Password Login
                if (credentials?.email && credentials?.password) {
                    return await authService.validateCredentials(
                        credentials.email as string,
                        credentials.password as string
                    );
                }

                return null;
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
            await authService.handleNewUser(user);
        },
    },
});
