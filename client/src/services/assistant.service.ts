import { request } from './api';

export interface GroundedSourceRef {
  sourceType: string;
  recordId: string;
  title: string;
  snippet: string;
  urlOrRoute: string;
}

export interface ProposedActionRef {
  actionId?: string;
  actionType: 'create_mentorship_request' | 'create_feed_post' | 'register_for_event' | 'request_ride_seat';
  payload: Record<string, any>;
  summary: string;
}

export interface AssistantMessageItem {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundedSourceRef[];
  proposedAction?: ProposedActionRef | null;
  isLiveCloud?: boolean;
  providerNote?: string;
  createdAt?: string;
}

export interface AssistantConversationSummary {
  id: string;
  userId: string;
  title: string;
  model: string;
  messageCount: number;
  lastMessagePreview?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AssistantService = {
  getConversations: async () => {
    const res = await request<{ success: boolean; data: { conversations: AssistantConversationSummary[] } }>('/assistant/conversations');
    return res.data.conversations;
  },

  createConversation: async (title = 'Campus Guidance') => {
    const res = await request<{ success: boolean; data: AssistantConversationSummary }>('/assistant/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    return res.data;
  },

  getConversation: async (conversationId: string) => {
    const res = await request<{ success: boolean; data: { conversation: AssistantConversationSummary; messages: AssistantMessageItem[] } }>(`/assistant/conversations/${conversationId}`);
    return res.data;
  },

  deleteConversation: async (conversationId: string) => {
    return await request<{ success: boolean; message: string }>(`/assistant/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  },

  sendMessage: async (conversationId: string, message: string) => {
    const res = await request<{
      success: boolean;
      data: {
        messageId: string;
        role: 'assistant';
        content: string;
        isLiveCloud: boolean;
        providerNote: string;
        model: string;
        sources: GroundedSourceRef[];
        proposedAction?: ProposedActionRef;
      };
    }>(`/assistant/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return res.data;
  },

  confirmAction: async (actionId: string) => {
    const res = await request<{ success: boolean; data: any; message: string }>(`/assistant/actions/${actionId}/confirm`, {
      method: 'POST'
    });
    return res.data;
  }
};
