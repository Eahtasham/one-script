import { auth } from '@/lib/auth';
import { getUserOrganizations, isOrganizationAdmin } from '@/lib/session';
import { getOrganizationMembers, getPendingInvitations } from '@/services/team';
import SettingsPageClient from './settings-client';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) return null;

    const userOrgs = await getUserOrganizations(session.user.id);
    const primaryOrg = userOrgs[0];

    if (!primaryOrg) return null;

    const isAdmin = await isOrganizationAdmin(session.user.id, primaryOrg.organization.id);

    // Get team members
    const membersResult = await getOrganizationMembers(primaryOrg.organization.id);
    const members = membersResult.success ? (membersResult.members || []) : [];

    // Get pending invitations if admin
    let pendingInvitations: Awaited<ReturnType<typeof getPendingInvitations>>['invitations'] = [];
    if (isAdmin) {
        const invitesResult = await getPendingInvitations(primaryOrg.organization.id);
        pendingInvitations = invitesResult.success ? (invitesResult.invitations || []) : [];
    }

    return (
        <SettingsPageClient
            organization={{
                id: primaryOrg.organization.id,
                name: primaryOrg.organization.name,
                slug: primaryOrg.organization.slug,
                widgetId: primaryOrg.organization.widgetId,
            }}
            members={members.map(m => ({
                membership: {
                    id: m.membership.id,
                    userId: m.membership.userId,
                    role: m.membership.role,
                    joinedAt: m.membership.joinedAt,
                },
                profile: {
                    id: m.profile.id,
                    email: m.profile.email,
                    fullName: m.profile.fullName,
                },
            }))}
            pendingInvitations={(pendingInvitations || []).map(inv => ({
                id: inv.id,
                email: inv.email,
                role: inv.role,
                createdAt: inv.createdAt,
                expiresAt: inv.expiresAt,
            }))}
            isAdmin={isAdmin}
            currentUserId={session.user.id}
        />
    );
}