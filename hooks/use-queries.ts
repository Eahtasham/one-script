import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Example query hooks demonstrating TanStack Query patterns
 * Replace placeholder implementations with real API calls as the codebase grows
 */

// Query key factory for consistent key management
export const queryKeys = {
    all: ['all'] as const,
    organizations: () => [...queryKeys.all, 'organizations'] as const,
    organization: (id: string) => [...queryKeys.organizations(), id] as const,
    conversations: () => [...queryKeys.all, 'conversations'] as const,
    conversation: (id: string) => [...queryKeys.conversations(), id] as const,
    messages: (conversationId: string) => [...queryKeys.conversation(conversationId), 'messages'] as const,
    knowledgeBase: () => [...queryKeys.all, 'knowledgeBase'] as const,
    knowledgeItem: (id: string) => [...queryKeys.knowledgeBase(), id] as const,
    team: () => [...queryKeys.all, 'team'] as const,
    teamMember: (id: string) => [...queryKeys.team(), id] as const,
};

// Example: Fetch organization data
// Replace the queryFn with actual API call when ready
export function useOrganizationQuery(organizationId: string) {
    return useQuery({
        queryKey: queryKeys.organization(organizationId),
        queryFn: async () => {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/organizations/${organizationId}`);
            // return response.json();
            return null;
        },
        enabled: !!organizationId,
    });
}

// Example: Fetch conversations list
export function useConversationsQuery() {
    return useQuery({
        queryKey: queryKeys.conversations(),
        queryFn: async () => {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/conversations');
            // return response.json();
            return [];
        },
    });
}

// Example: Fetch messages for a conversation
export function useMessagesQuery(conversationId: string) {
    return useQuery({
        queryKey: queryKeys.messages(conversationId),
        queryFn: async () => {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/conversations/${conversationId}/messages`);
            // return response.json();
            return [];
        },
        enabled: !!conversationId,
    });
}

// Example: Send a new message mutation
export function useSendMessageMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { conversationId: string; message: string }) => {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/conversations/${data.conversationId}/messages`, {
            //   method: 'POST',
            //   body: JSON.stringify({ message: data.message }),
            // });
            // return response.json();
            return { id: Date.now().toString(), content: data.message };
        },
        onSuccess: (_, variables) => {
            // Invalidate and refetch messages for this conversation
            queryClient.invalidateQueries({
                queryKey: queryKeys.messages(variables.conversationId),
            });
        },
    });
}

// Example: Fetch team members
export function useTeamQuery() {
    return useQuery({
        queryKey: queryKeys.team(),
        queryFn: async () => {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/team');
            // return response.json();
            return [];
        },
    });
}

// Example: Invite team member mutation
export function useInviteMemberMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { email: string; role: string }) => {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/team/invite', {
            //   method: 'POST',
            //   body: JSON.stringify(data),
            // });
            // return response.json();
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.team() });
        },
    });
}
