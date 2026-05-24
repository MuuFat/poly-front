import api from '@/lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  language: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
  messages?: Message[];
}

export const chatService = {
  async sendMessage(message: string, language: string) {
    const response = await api.post('/api/ai/chat', {
      message,
      language,
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
};
