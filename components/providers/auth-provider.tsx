'use client';

import { useEffect } from 'react';
import { useAuthStore, type UserOrganization } from '@/stores/auth-store';
import type { AuthUser } from '@/types';

interface AuthProviderProps {
    children: React.ReactNode;
    user: AuthUser;
    organizations: UserOrganization[];
    activeOrgId?: string;  // Optional: specify which org to activate (e.g., from invitation)
}

/**
 * AuthProvider hydrates the Zustand auth store with server-fetched data.
 * This should wrap the dashboard layout so auth state is available to all child components.
 * 
 * Usage:
 * - Server component fetches auth data once (all organizations)
 * - AuthProvider hydrates the client-side store
 * - Child components use useAuthStore() / useUser() / useActiveOrganization() hooks
 * 
 * Active Organization Priority:
 * 1. activeOrgId prop (if provided - e.g., from invitation redirect)
 * 2. Previously stored org ID (from localStorage via Zustand persist)
 * 3. First organization in the list
 */
export function AuthProvider({ children, user, organizations, activeOrgId }: AuthProviderProps) {
    const setAuth = useAuthStore((state) => state.setAuth);
    const storedActiveOrgId = useAuthStore((state) => state.activeOrganization?.id);

    useEffect(() => {
        // Determine which org to activate
        // Priority: activeOrgId prop > stored preference > first org
        const targetOrgId = activeOrgId || storedActiveOrgId;

        setAuth({
            user,
            organizations,
            activeOrgId: targetOrgId,
        });
    }, [user, organizations, activeOrgId, storedActiveOrgId, setAuth]);

    return <>{children}</>;
}

// Re-export auth hooks for convenience
export {
    useUser,
    useOrganizations,
    useActiveOrganization,
    useActiveMembership,
    useIsAdmin,
    useUserRole,
} from '@/stores/auth-store';
