import { auth } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
    const session = await auth();
    return session?.user ?? null;
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Not authenticated');
    }
    return user;
}

/**
 * Get user's organizations with membership info
 */
export async function getUserOrganizations(userId: string) {
    const memberships = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.userId, userId),
        with: {
            organization: true,
        },
    });

    return memberships.map((m) => ({
        organization: m.organization,
        membership: m,
    }));
}

/**
 * Check if user is admin of an organization
 */
export async function isOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
    const membership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId)
        ),
    });

    return membership?.role === 'admin';
}

/**
 * Require admin role for an organization
 */
export async function requireAdmin(userId: string, organizationId: string) {
    const isAdmin = await isOrganizationAdmin(userId, organizationId);
    if (!isAdmin) {
        throw new Error('Admin access required');
    }
    return true;
}

/**
 * Get user profile with organization
 */
export async function getUserWithOrganization(userId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) return null;

    const orgs = await getUserOrganizations(userId);
    const primaryOrg = orgs[0];

    return {
        user,
        organization: primaryOrg?.organization ?? null,
        membership: primaryOrg?.membership ?? null,
        isAdmin: primaryOrg?.membership?.role === 'admin',
    };
}
