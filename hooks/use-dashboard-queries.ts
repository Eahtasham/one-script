import { useQuery } from '@tanstack/react-query';

/**
 * Dashboard-specific TanStack Query hooks
 * These hooks fetch and cache dashboard data with automatic refetching
 */

// Query key factory for dashboard queries
export const dashboardQueryKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
    team: (organizationId: string) => [...dashboardQueryKeys.all, 'team', organizationId] as const,
};

// Types
interface DashboardStats {
    knowledgeSources: number;
    conversations: number;
    widgetConfigured: boolean;
    widgetId: string;
}

interface TeamMember {
    membership: {
        id: string;
        userId: string;
        role: string;
        joinedAt: Date;
    };
    profile: {
        id: string;
        email: string;
        fullName: string | null;
    };
}

/**
 * Fetches dashboard statistics (knowledge sources count, conversations count, etc.)
 * Data is cached for 5 minutes by default (configured in QueryProvider)
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardQueryKeys.stats(),
        queryFn: async (): Promise<DashboardStats> => {
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            return response.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Fetches team members for an organization
 */
export function useTeamMembers(organizationId: string) {
    return useQuery({
        queryKey: dashboardQueryKeys.team(organizationId),
        queryFn: async (): Promise<TeamMember[]> => {
            const response = await fetch(`/api/team?organizationId=${organizationId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch team members');
            }
            const data = await response.json();
            return data.members || [];
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
