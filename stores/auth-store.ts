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

// Combined organization with membership info
export interface UserOrganization {
    organization: Organization;
    membership: OrganizationMember;
}

interface AuthState {
    // State
    user: AuthUser | null;
    organizations: UserOrganization[];  // All user's organizations
    activeOrganization: Organization | null;  // Currently selected
    activeMembership: OrganizationMember | null;  // Current membership/role
    isInitialized: boolean;

    // Actions
    setUser: (user: AuthUser | null) => void;
    setOrganizations: (orgs: UserOrganization[]) => void;
    switchOrganization: (orgId: string) => void;
    setAuth: (data: {
        user: AuthUser;
        organizations: UserOrganization[];
        activeOrgId?: string;  // Optional: specify which org to activate (e.g., from invitation)
    }) => void;
    clearAuth: () => void;
    setInitialized: (initialized: boolean) => void;
}

// Helper to find org by ID or return first
const findOrganization = (orgs: UserOrganization[], orgId?: string): UserOrganization | null => {
    if (orgs.length === 0) return null;
    if (orgId) {
        const found = orgs.find(o => o.organization.id === orgId);
        if (found) return found;
    }
    return orgs[0];
};

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                user: null,
                organizations: [],
                activeOrganization: null,
                activeMembership: null,
                isInitialized: false,

                // Actions
                setUser: (user) => set({ user }, false, 'auth/setUser'),

                setOrganizations: (organizations) => {
                    const current = get();
                    const activeOrgId = current.activeOrganization?.id;
                    const active = findOrganization(organizations, activeOrgId);

                    set({
                        organizations,
                        activeOrganization: active?.organization ?? null,
                        activeMembership: active?.membership ?? null,
                    }, false, 'auth/setOrganizations');
                },

                switchOrganization: (orgId) => {
                    const { organizations } = get();
                    const found = organizations.find(o => o.organization.id === orgId);

                    if (found) {
                        set({
                            activeOrganization: found.organization,
                            activeMembership: found.membership,
                        }, false, 'auth/switchOrganization');
                    }
                },

                setAuth: (data) => {
                    const active = findOrganization(data.organizations, data.activeOrgId);

                    set({
                        user: data.user,
                        organizations: data.organizations,
                        activeOrganization: active?.organization ?? null,
                        activeMembership: active?.membership ?? null,
                        isInitialized: true,
                    }, false, 'auth/setAuth');
                },

                clearAuth: () => set({
                    user: null,
                    organizations: [],
                    activeOrganization: null,
                    activeMembership: null,
                    isInitialized: false,
                }, false, 'auth/clearAuth'),

                setInitialized: (isInitialized) => set({ isInitialized }, false, 'auth/setInitialized'),
            }),
            {
                name: 'auth-storage',
                // Only persist the active organization ID, not all data
                partialize: (state) => ({
                    activeOrganizationId: state.activeOrganization?.id,
                }),
            }
        ),
        { name: 'auth-store' }
    )
);

// Selector hooks for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useOrganizations = () => useAuthStore((state) => state.organizations);
export const useActiveOrganization = () => useAuthStore((state) => state.activeOrganization);
export const useActiveMembership = () => useAuthStore((state) => state.activeMembership);
export const useIsAdmin = () => useAuthStore((state) => state.activeMembership?.role === 'admin');
export const useUserRole = () => useAuthStore((state) => state.activeMembership?.role ?? null);
