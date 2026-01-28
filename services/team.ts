'use server';

import { db } from '@/db';
import {
    invitations,
    organizationMembers,
    users,
    organizations,
    type UserRole
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { requireAuth, isOrganizationAdmin } from '@/lib/session';

const getURL = () => {
    let url =
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';

    url = url.endsWith('/') ? url : `${url}/`;
    return url;
};

/**
 * Invite a team member to an organization
 */
export async function inviteTeamMember(
    organizationId: string,
    email: string,
    role: UserRole = 'member'
) {
    const currentUser = await requireAuth();

    // Verify user is admin
    const isAdmin = await isOrganizationAdmin(currentUser.id, organizationId);
    if (!isAdmin) {
        return { error: 'Only admins can invite team members' };
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
        // Check if already a member
        const existingMember = await db.query.organizationMembers.findFirst({
            where: and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.userId, existingUser.id)
            ),
        });

        if (existingMember) {
            return { error: 'This user is already a member of the organization' };
        }
    }

    // Check for pending invitation
    const pendingInvitation = await db.query.invitations.findFirst({
        where: and(
            eq(invitations.organizationId, organizationId),
            eq(invitations.email, email.toLowerCase()),
            eq(invitations.status, 'pending')
        ),
    });

    if (pendingInvitation) {
        return { error: 'An invitation has already been sent to this email' };
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const [invitation] = await db.insert(invitations).values({
        organizationId,
        email: email.toLowerCase(),
        role,
        invitedById: currentUser.id,
        token,
        expiresAt,
    }).returning();

    // Get organization details for email
    const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
    });

    const inviteUrl = `${getURL()}invite/${token}`;

    // TODO: Send invitation email here
    // You can integrate with Resend, SendGrid, or any email service
    console.log(`Invitation URL for ${email}: ${inviteUrl}`);

    return {
        success: true,
        invitation,
        inviteUrl, // For manual sharing if needed
        message: `Invitation sent to ${email}`,
    };
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string) {
    const currentUser = await requireAuth();

    // Find the invitation
    const invitation = await db.query.invitations.findFirst({
        where: and(
            eq(invitations.token, token),
            eq(invitations.status, 'pending')
        ),
    });

    if (!invitation) {
        return { error: 'Invalid or expired invitation' };
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
        await db.update(invitations)
            .set({ status: 'expired' })
            .where(eq(invitations.id, invitation.id));

        return { error: 'This invitation has expired' };
    }

    // Verify email matches
    if (currentUser.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        return { error: 'This invitation was sent to a different email address' };
    }

    // Check if already a member
    const existingMember = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.organizationId, invitation.organizationId),
            eq(organizationMembers.userId, currentUser.id)
        ),
    });

    if (existingMember) {
        await db.update(invitations)
            .set({ status: 'accepted', acceptedAt: new Date() })
            .where(eq(invitations.id, invitation.id));

        return { success: true, message: 'You are already a member of this organization' };
    }

    // Add user to organization
    await db.insert(organizationMembers).values({
        organizationId: invitation.organizationId,
        userId: currentUser.id,
        role: invitation.role,
    });

    // Update invitation status
    await db.update(invitations)
        .set({ status: 'accepted', acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

    return { success: true, organizationId: invitation.organizationId };
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(invitationId: string, organizationId: string) {
    const currentUser = await requireAuth();

    const isAdmin = await isOrganizationAdmin(currentUser.id, organizationId);
    if (!isAdmin) {
        return { error: 'Only admins can cancel invitations' };
    }

    await db.update(invitations)
        .set({ status: 'cancelled' })
        .where(
            and(
                eq(invitations.id, invitationId),
                eq(invitations.organizationId, organizationId)
            )
        );

    return { success: true };
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
    memberId: string,
    organizationId: string,
    newRole: UserRole
) {
    const currentUser = await requireAuth();

    const isAdmin = await isOrganizationAdmin(currentUser.id, organizationId);
    if (!isAdmin) {
        return { error: 'Only admins can update member roles' };
    }

    const member = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.id, memberId),
            eq(organizationMembers.organizationId, organizationId)
        ),
    });

    if (!member) {
        return { error: 'Member not found' };
    }

    // Prevent demoting the last admin
    if (member.role === 'admin' && newRole === 'member') {
        const adminCount = await db.query.organizationMembers.findMany({
            where: and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.role, 'admin')
            ),
        });

        if (adminCount.length <= 1) {
            return { error: 'Cannot demote the last admin' };
        }
    }

    await db.update(organizationMembers)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(organizationMembers.id, memberId));

    return { success: true };
}

/**
 * Remove a member from organization
 */
export async function removeMember(memberId: string, organizationId: string) {
    const currentUser = await requireAuth();

    const isAdmin = await isOrganizationAdmin(currentUser.id, organizationId);
    if (!isAdmin) {
        return { error: 'Only admins can remove members' };
    }

    const member = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.id, memberId),
            eq(organizationMembers.organizationId, organizationId)
        ),
    });

    if (!member) {
        return { error: 'Member not found' };
    }

    // Prevent removing the last admin
    if (member.role === 'admin') {
        const adminCount = await db.query.organizationMembers.findMany({
            where: and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.role, 'admin')
            ),
        });

        if (adminCount.length <= 1) {
            return { error: 'Cannot remove the last admin' };
        }
    }

    // Prevent self-removal
    if (member.userId === currentUser.id) {
        return { error: 'Use "Leave organization" to remove yourself' };
    }

    await db.delete(organizationMembers)
        .where(eq(organizationMembers.id, memberId));

    return { success: true };
}

/**
 * Leave an organization
 */
export async function leaveOrganization(organizationId: string) {
    const currentUser = await requireAuth();

    const member = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, currentUser.id)
        ),
    });

    if (!member) {
        return { error: 'You are not a member of this organization' };
    }

    // Prevent last admin from leaving
    if (member.role === 'admin') {
        const adminCount = await db.query.organizationMembers.findMany({
            where: and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.role, 'admin')
            ),
        });

        if (adminCount.length <= 1) {
            return { error: 'As the last admin, you must transfer ownership or delete the organization' };
        }
    }

    await db.delete(organizationMembers)
        .where(
            and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.userId, currentUser.id)
            )
        );

    return { success: true };
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string) {
    const currentUser = await requireAuth();

    const membership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, currentUser.id)
        ),
    });

    if (!membership) {
        return { error: 'You are not a member of this organization' };
    }

    const members = await db
        .select({
            membership: organizationMembers,
            profile: {
                id: users.id,
                email: users.email,
                fullName: users.name,
            },
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, organizationId));

    return { success: true, members };
}

/**
 * Get pending invitations for an organization
 */
export async function getPendingInvitations(organizationId: string) {
    const currentUser = await requireAuth();

    const isAdmin = await isOrganizationAdmin(currentUser.id, organizationId);
    if (!isAdmin) {
        return { error: 'Only admins can view pending invitations' };
    }

    const pendingInvites = await db.query.invitations.findMany({
        where: and(
            eq(invitations.organizationId, organizationId),
            eq(invitations.status, 'pending')
        ),
        orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    });

    return { success: true, invitations: pendingInvites };
}
