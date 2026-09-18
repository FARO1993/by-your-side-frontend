import apiClient from './client';
import type { Conversation, Message, Page } from './types';

export async function getOrCreateConversation(userId: string): Promise<Conversation> {
  const response = await apiClient.post<Conversation>(`/api/conversations/${userId}`);
  return response.data;
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<Conversation[]>('/api/conversations');
  return response.data;
}

export async function getMessages(conversationId: string, page = 0, size = 50): Promise<Page<Message>> {
  const response = await apiClient.get<Page<Message>>(`/api/conversations/${conversationId}/messages`, {
    params: { page, size },
  });
  return response.data;
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const response = await apiClient.post<Message>(`/api/conversations/${conversationId}/messages`, { content });
  return response.data;
}