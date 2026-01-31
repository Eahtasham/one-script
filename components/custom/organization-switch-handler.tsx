'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Client component to handle organization switch from query params.
 * Used when user accepts an invitation and is redirected with ?switch-org=<orgId>
 */
export function OrganizationSwitchHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const switchOrganization = useAuthStore((state) => state.switchOrganization);
    const organizations = useAuthStore((state) => state.organizations);

    useEffect(() => {
        const switchOrgId = searchParams.get('switch-org');

        if (switchOrgId && organizations.length > 0) {
            // Verify user is member of this org
            const targetOrg = organizations.find(o => o.organization.id === switchOrgId);

            if (targetOrg) {
                // Update Zustand store
                switchOrganization(switchOrgId);

                // Set cookie for server-side preference
                document.cookie = `active-org-id=${switchOrgId}; path=/; max-age=${60 * 60 * 24 * 365}`;

                // Remove the query param from URL (clean up)
                const url = new URL(window.location.href);
                url.searchParams.delete('switch-org');
                router.replace(url.pathname, { scroll: false });
            }
        }
    }, [searchParams, organizations, switchOrganization, router]);

    return null; // This component doesn't render anything
}
