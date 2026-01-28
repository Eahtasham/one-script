import { db } from '@/db';
import {
    users,
    verificationTokens,
    organizations,
    organizationMembers
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { emailService } from '@/services/email';
import { User } from 'next-auth';

export const authService = {
    /**
     * Verifies a magic link token and returns the user if valid.
     */
    async verifyLoginToken(token: string) {
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

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
        };
    },

    /**
     * Validates email/password credentials.
     */
    async validateCredentials(email: string, password: string): Promise<User | null> {
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
    },

    /**
     * Handles post-registration logic (create default org, send welcome email).
     */
    async handleNewUser(user: User) {
        if (!user.id || !user.email) return;

        const orgName = user.name
            ? `${user.name}'s Workspace`
            : `${user.email.split('@')[0]}'s Workspace`;

        const slug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);

        // Check if user already has an organization (safety check)
        const existingMember = await db.query.organizationMembers.findFirst({
            where: eq(organizationMembers.userId, user.id)
        });

        if (existingMember) return;

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
};
