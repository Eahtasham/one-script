import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserOrganizations } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import DashboardLayoutClient from './layout-client';
import { AuthProvider } from '@/components/providers/auth-provider';

// Cookie name for storing the user's last active organization
const ACTIVE_ORG_COOKIE = 'active-org-id';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Get full user data
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!user) {
        redirect('/login');
    }

    // Get ALL user organizations (not just the first one)
    const userOrgs = await getUserOrganizations(session.user.id);

    // If user has no organization, redirect to onboarding
    if (userOrgs.length === 0) {
        redirect('/onboarding');
    }

    // Check for active org preference from cookie
    const cookieStore = await cookies();
    const storedActiveOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

    // Determine which org to activate
    // Priority: cookie preference > first org
    const activeOrg = storedActiveOrgId
        ? userOrgs.find(o => o.organization.id === storedActiveOrgId) || userOrgs[0]
        : userOrgs[0];

    return (
        <AuthProvider
            user={{
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
            }}
            organizations={userOrgs}
            activeOrgId={activeOrg.organization.id}
        >
            <DashboardLayoutClient
                user={{
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                }}
                organizations={userOrgs}
                activeOrganization={activeOrg.organization}
                activeMembership={activeOrg.membership}
            >
                {children}
            </DashboardLayoutClient>
        </AuthProvider>
    );
}
