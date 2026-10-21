import api from './axiosConfig';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  icon?: string;
  createdAt: string;
  readAt?: string | null;
  userId?: number;
  senderId?: number;
  role?: string;
  entityId?: number;
  entityType?: string;
  actionUrl?: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  metadata?: Record<string, unknown>;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType?: Record<string, number>;
}

export interface NotificationPreference {
  id?: number;
  userId?: number;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationFilters {
  status?: 'UNREAD' | 'READ' | 'ARCHIVED';
  type?: string;
  search?: string;
  page?: number;
  size?: number;
}

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const notificationApi = {
  getMyNotifications: (filters: NotificationFilters = {}) =>
    api.get('/v1/notifications', { params: filters }).then<NotificationPage>(unwrap),

  getUnreadCount: () =>
    api.get('/v1/notifications/unread-count').then<number>(unwrap),

  markAsRead: (id: number) =>
    api.patch(`/v1/notifications/${id}/read`).then<Notification>(unwrap),

  markAllAsRead: () =>
    api.patch('/v1/notifications/read-all').then<number>(unwrap),

  deleteNotification: (id: number) =>
    api.delete(`/v1/notifications/${id}`).then<void>(() => undefined),

  getStats: () =>
    api.get('/v1/notifications/stats').then<NotificationStats>(unwrap),

  getPreferences: () =>
    api.get('/v1/notifications/preferences').then<NotificationPreference>(unwrap),

  updatePreferences: (prefs: Partial<NotificationPreference>) =>
    api.put('/v1/notifications/preferences', prefs).then<NotificationPreference>(unwrap),

  // Admin
  getAllNotifications: (filters: NotificationFilters & { role?: string } = {}) =>
    api.get('/v1/notifications/admin/all', { params: filters }).then<NotificationPage>(unwrap),

  getGlobalStats: () =>
    api.get('/v1/notifications/admin/stats').then<NotificationStats>(unwrap),
};
