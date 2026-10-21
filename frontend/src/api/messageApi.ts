import api from './axiosConfig';
import { Message, Conversation } from '../types';

export interface SendMessageRequest {
  receiverId: number;
  propertyId?: number;
  content: string;
}

export const messageApi = {
  send: (data: SendMessageRequest) =>
    api.post<Message>('/v1/messages', data),

  getConversations: () =>
    api.get<Conversation[]>('/v1/messages/conversations'),

  getConversation: (userId: number, page = 0, size = 100, sort?: 'ASC' | 'DESC') => {
    let url = `/v1/messages/conversation?userId=${userId}&page=${page}&size=${size}`;
    if (sort) {
      url += `&sort=${sort}`;
    }
    return api.get<Message[]>(url);
  },

  getUnreadCount: () =>
    api.get<number>('/v1/messages/unread-count'),

  markAsRead: (messageId: number) =>
    api.put(`/v1/messages/${messageId}/read`),

  delete: (messageId: number) =>
    api.delete(`/v1/messages/${messageId}`),
};
