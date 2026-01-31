import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserOrganizations } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import DashboardLayoutClient from './layout-client';
import { AuthProvider } from '@/components/providers/auth-provider';

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

    const userOrgs = await getUserOrganizations(session.user.id);

    // If user has no organization, redirect to onboarding
    if (userOrgs.length === 0) {
        redirect('/onboarding');
    }

    const primaryOrg = userOrgs[0];

    return (
        <AuthProvider
            user={{
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
            }}
            organization={primaryOrg.organization}
            membership={primaryOrg.membership}
        >
            <DashboardLayoutClient
                user={{
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                }}
                organization={primaryOrg.organization}
                membership={primaryOrg.membership}
            >
                {children}
            </DashboardLayoutClient>
        </AuthProvider>
    );
}

