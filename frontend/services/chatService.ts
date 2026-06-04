import api from '@/lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title?: string | null;
  language: string;
  lastMessage: Message | null;
  messageCount: number;
  updatedAt: string;
  messages?: Message[];
}

export interface SendMessageResponse {
  reply: string;
  conversationId: string | null;
}

export const chatService = {
  async sendMessage(
    message: string,
    language: string,
    conversationId?: string | null,
  ): Promise<SendMessageResponse> {
    const response = await api.post('/api/ai/chat', {
      message,
      language,
      conversationId,
    });
    return response.data;
  },

  async getConversations(params?: { language?: string; page?: number; limit?: number }) {
    const response = await api.get('/api/conversations', { params });
    return response.data;
  },

  async getConversation(id: string, params?: { page?: number; limit?: number }) {
    const response = await api.get(`/api/conversations/${id}`, { params });
    return response.data;
  },

  async deleteConversation(id: string) {
    const response = await api.delete(`/api/conversations/${id}`);
    return response.data;
  },

  async deleteAllConversations() {
    const response = await api.delete('/api/conversations', { params: { all: true } });
    return response.data;
  },
};
