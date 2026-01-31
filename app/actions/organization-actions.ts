'use server';

import { cookies } from 'next/headers';

const ACTIVE_ORG_COOKIE = 'active-org-id';

/**
 * Server action to set the active organization cookie
 * This can be called from client components after switching organizations
 */
export async function setActiveOrganizationCookie(organizationId: string) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: false, // Allow client-side access for reading
        sameSite: 'lax',
    });
    return { success: true };
}

/**
 * Server action to get the active organization cookie
 */
export async function getActiveOrganizationCookie() {
    const cookieStore = await cookies();
    return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}
