import type { Organization, OrganizationMember } from '@/db/schema';

// Re-export database types for convenience
export type { Organization, OrganizationMember } from '@/db/schema';

/**
 * Auth user type (subset of full user for client-side use)
 */
export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

/**
 * Combined organization with membership info
 */
export interface UserOrganization {
    organization: Organization;
    membership: OrganizationMember;
}

/**
 * Auth context data passed to providers and components
 */
export interface AuthContextData {
    user: AuthUser;
    organizations: UserOrganization[];
    activeOrganization: Organization;
    activeMembership: OrganizationMember;
    isAdmin: boolean;
}

/**
 * User role type
 */
export type UserRole = 'admin' | 'member';

/**
 * Route access type based on role
 */
export type RouteAccess = 'admin' | 'member' | 'all';