import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatState {
    // State
    activeConversationId: string | null;
    messages: Message[];
    messageInput: string;
    isLoading: boolean;

    // Actions
    setActiveConversation: (conversationId: string | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    setMessageInput: (input: string) => void;
    setIsLoading: (loading: boolean) => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
    devtools(
        (set) => ({
            // Initial state
            activeConversationId: null,
            messages: [],
            messageInput: '',
            isLoading: false,

            // Actions
            setActiveConversation: (activeConversationId) => set(
                { activeConversationId },
                false,
                'chat/setActiveConversation'
            ),
            setMessages: (messages) => set(
                { messages },
                false,
                'chat/setMessages'
            ),
            addMessage: (message) => set(
                (state) => ({ messages: [...state.messages, message] }),
                false,
                'chat/addMessage'
            ),
            setMessageInput: (messageInput) => set(
                { messageInput },
                false,
                'chat/setMessageInput'
            ),
            setIsLoading: (isLoading) => set(
                { isLoading },
                false,
                'chat/setIsLoading'
            ),
            clearChat: () => set({
                activeConversationId: null,
                messages: [],
                messageInput: '',
                isLoading: false,
            }, false, 'chat/clearChat'),
        }),
        { name: 'chat-store' }
    )
);

// Selector hooks
export const useActiveConversation = () => useChatStore((state) => state.activeConversationId);
export const useMessages = () => useChatStore((state) => state.messages);
export const useMessageInput = () => useChatStore((state) => state.messageInput);
export const useChatLoading = () => useChatStore((state) => state.isLoading);
