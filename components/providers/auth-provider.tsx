'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import type { Organization, OrganizationMember } from '@/db/schema';

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

interface AuthProviderProps {
    children: React.ReactNode;
    user: AuthUser;
    organization: Organization;
    membership: OrganizationMember;
}

/**
 * AuthProvider hydrates the Zustand auth store with server-fetched data.
 * This should wrap the dashboard layout so auth state is available to all child components.
 * 
 * Usage:
 * - Server component fetches auth data once
 * - AuthProvider hydrates the client-side store
 * - Child components use useAuthStore() / useUser() / useOrganization() hooks
 */
export function AuthProvider({ children, user, organization, membership }: AuthProviderProps) {
    const setAuth = useAuthStore((state) => state.setAuth);
    const isInitialized = useAuthStore((state) => state.isInitialized);

    useEffect(() => {
        // Only hydrate if not already initialized or if data changed
        setAuth({ user, organization, membership });
    }, [user, organization, membership, setAuth]);

    return <>{children}</>;
}

// Re-export auth hooks for convenience
export { useUser, useOrganization, useMembership, useIsAdmin } from '@/stores/auth-store';
