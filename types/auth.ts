/**
 * User role in an organization
 */
export type UserRole = 'admin' | 'member';

/**
 * Organization membership with role
 */
export interface OrganizationMembership {
    id: string;
    organizationId: string;
    userId: string;
    role: UserRole;
    joinedAt: Date;
    updatedAt: Date;
}

/**
 * User profile
 */
export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User preferences
 */
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    emailDigest?: 'daily' | 'weekly' | 'never';
}

/**
 * Organization details
 */
export interface Organization {
    id: string;
    name: string;
    slug: string;
    websiteUrl: string | null;
    logoUrl: string | null;
    widgetId: string;
    widgetConfig: WidgetConfig;
    subscriptionTier: SubscriptionTier;
    subscriptionExpiresAt: Date | null;
    onboardingCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
    primaryColor?: string;
    welcomeMessage?: string;
    position?: 'bottom-right' | 'bottom-left';
    botName?: string;
}

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * Invitation status
 */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

/**
 * Team invitation
 */
export interface Invitation {
    id: string;
    organizationId: string;
    email: string;
    role: UserRole;
    status: InvitationStatus;
    invitedById: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    acceptedAt: Date | null;
}

/**
 * Team member with profile
 */
export interface TeamMember {
    membership: OrganizationMembership;
    profile: UserProfile;
}

/**
 * Permission check functions
 */
export interface Permissions {
    canManageTeam: boolean;
    canManageBilling: boolean;
    canDeleteOrganization: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canUpdateRoles: boolean;
    canManageKnowledge: boolean;
    canViewConversations: boolean;
    canReplyToConversations: boolean;
}

/**
 * Get permissions based on role
 */
export function getPermissions(role: UserRole): Permissions {
    if (role === 'admin') {
        return {
            canManageTeam: true,
            canManageBilling: true,
            canDeleteOrganization: true,
            canInviteMembers: true,
            canRemoveMembers: true,
            canUpdateRoles: true,
            canManageKnowledge: true,
            canViewConversations: true,
            canReplyToConversations: true,
        };
    }

    // Member permissions
    return {
        canManageTeam: false,
        canManageBilling: false,
        canDeleteOrganization: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canUpdateRoles: false,
        canManageKnowledge: true,
        canViewConversations: true,
        canReplyToConversations: true,
    };
}
