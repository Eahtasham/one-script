import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Organization, OrganizationMember } from '@/db/schema';

// User type for auth store
interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

interface AuthState {
    // State
    user: AuthUser | null;
    organization: Organization | null;
    membership: OrganizationMember | null;
    isInitialized: boolean;

    // Actions
    setUser: (user: AuthUser | null) => void;
    setOrganization: (org: Organization | null) => void;
    setMembership: (membership: OrganizationMember | null) => void;
    setAuth: (data: {
        user: AuthUser;
        organization: Organization;
        membership: OrganizationMember;
    }) => void;
    clearAuth: () => void;
    setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        (set) => ({
            // Initial state
            user: null,
            organization: null,
            membership: null,
            isInitialized: false,

            // Actions
            setUser: (user) => set({ user }, false, 'auth/setUser'),
            setOrganization: (organization) => set({ organization }, false, 'auth/setOrganization'),
            setMembership: (membership) => set({ membership }, false, 'auth/setMembership'),
            setAuth: (data) => set({
                user: data.user,
                organization: data.organization,
                membership: data.membership,
                isInitialized: true,
            }, false, 'auth/setAuth'),
            clearAuth: () => set({
                user: null,
                organization: null,
                membership: null,
                isInitialized: false,
            }, false, 'auth/clearAuth'),
            setInitialized: (isInitialized) => set({ isInitialized }, false, 'auth/setInitialized'),
        }),
        { name: 'auth-store' }
    )
);

// Selector hooks for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useOrganization = () => useAuthStore((state) => state.organization);
export const useMembership = () => useAuthStore((state) => state.membership);
export const useIsAdmin = () => useAuthStore((state) => state.membership?.role === 'admin');
