'use server';

import { db } from '@/db';
import { organizationMembers, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/session';

/**
 * Switch to a different organization
 * Validates that the user is a member of the target organization
 */
export async function switchActiveOrganization(organizationId: string) {
    const currentUser = await requireAuth();

    // Verify user is member of target org
    const membership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.userId, currentUser.id),
            eq(organizationMembers.organizationId, organizationId)
        ),
    });

    if (!membership) {
        return { error: 'Not a member of this organization' };
    }

    // Get organization details
    const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
    });

    if (!organization) {
        return { error: 'Organization not found' };
    }

    return {
        success: true,
        organization,
        membership,
    };
}

/**
 * Get organization by ID with membership info for current user
 */
export async function getOrganizationWithMembership(organizationId: string) {
    const currentUser = await requireAuth();

    const membership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.userId, currentUser.id),
            eq(organizationMembers.organizationId, organizationId)
        ),
    });

    if (!membership) {
        return { error: 'Not a member of this organization' };
    }

    const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
    });

    return {
        success: true,
        organization,
        membership,
    };
}
