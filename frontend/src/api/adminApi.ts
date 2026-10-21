import api from './axiosConfig';
import { User, Property } from '../types';

export interface PlatformStats {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  verifiedUsers: number;
}

export interface EnhancedPlatformStats {
  totalUsers: number;
  totalProperties: number;
  pendingProperties: number;
  approvedProperties: number;
  availableProperties: number;
  verifiedUsers: number;
  totalMessages: number;
  totalFavorites: number;
  totalVisits: number;
  newPropertiesThisWeek: number;
  topCities: Array<{ name: string; count: number }>;
  usersByRole: Record<string, number>;
  conversionRate: number;
}

export interface EventLogEntry {
  id: number;
  eventId: string;
  eventType: string;
  userId: number | null;
  sessionId: string;
  ipAddress: string;
  deviceType: string;
  city: string;
  payload: string;
  serverTimestamp: string;
  processed: boolean;
}

export interface FraudCheckResponse {
  propertyId: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendedAction: string;
}

export interface AdminAd {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  type: string;
  plan: string;
  status: string;
  paymentStatus: string;
  priority: number;
  budget: number;
  views: number;
  clicks: number;
  impressions: number;
  createdByUserId: number;
  createdAt: string;
}

export interface AdminReview {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  propertyTitle: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'FLAGGED';
  reportCount: number;
  helpfulCount: number;
  sentimentLabel?: string;
  sentimentScore?: number;
  createdAt: string;
}

export interface AdminPayment {
  id: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  userId: number;
  advertisementId?: number;
  providerTransactionId?: string;
  createdAt: string;
}

export interface AdminAnalyticsDTO {
  totalUsers: number;
  newUsersThisMonth: number;
  totalProperties: number;
  newPropertiesThisMonth: number;
  totalAds: number;
  activeAds: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalMessages: number;
  totalReviews: number;
  averagePropertyRating: number;
  topCities: Array<{ name: string; count: number }>;
  userGrowthTrend: Array<{ date: string; count: number }>;
  propertyGrowthTrend: Array<{ date: string; count: number }>;
  revenueTrend: Array<{ date: string; amount: number }>;
}

export interface MonthlyPoint {
  month: string;
  monthLabel: string;
  users: number;
  properties: number;
  ads: number;
  reviews: number;
  revenue: number;
  visitors: number;
}

export interface YearlyPoint {
  year: number;
  users: number;
  properties: number;
  ads: number;
  reviews: number;
  revenue: number;
  visitors: number;
}

export const adminApi = {
  // ─── Users ──────────────────────────────────────────────
  getUsers: (page = 0, size = 20) => api.get('/v1/admin/users', { params: { page, size } }),
  getUserById: (id: number) => api.get(`/v1/admin/users/${id}`),
  deleteUser: (id: number) => api.delete(`/v1/admin/users/${id}`),
  getUnverifiedUsers: (page = 0, size = 20) => api.get('/v1/admin/users/unverified', { params: { page, size } }),
  verifyUser: (userId: number) => api.post('/v1/admin/users/verify', { userId }),
  banUser: (id: number, reason?: string) => api.post(`/v1/admin/users/${id}/ban`, { reason }),
  unbanUser: (id: number) => api.post(`/v1/admin/users/${id}/unban`),
  changeUserRole: (id: number, role: string) => api.put(`/v1/admin/users/${id}/role`, { role }),
  getSettings: () => api.get<Record<string, string>>('/v1/admin/settings'),
  updateSettings: (settings: Record<string, string>) => api.put('/v1/admin/settings', settings),

  // ─── Stats ──────────────────────────────────────────────
  getStats: () => api.get<PlatformStats>('/v1/admin/stats'),
  getEnhancedStats: () => api.get<EnhancedPlatformStats>('/v1/admin/stats/enhanced'),
  getDailyPropertyStats: (days = 30) => api.get('/v1/admin/stats/daily-properties', { params: { days } }),

  // ─── Properties ─────────────────────────────────────────
  getAllProperties: (status?: string, page = 0, size = 20) =>
    api.get('/v1/admin/properties', { params: { status, page, size } }),
  getPendingProperties: (page = 0, size = 20) =>
    api.get('/v1/admin/properties/pending', { params: { page, size } }),
  approveProperty: (propertyId: number) =>
    api.post('/v1/admin/properties/approve', { propertyId, approved: true }),
  rejectProperty: (propertyId: number, reason: string) =>
    api.post('/v1/admin/properties/reject', { propertyId, reason }),
  deleteProperty: (id: number) => api.delete(`/v1/admin/properties/${id}`),
  classifyProperty: (id: number, classification: 'verified' | 'premium' | 'normal') =>
    api.put(`/v1/admin/properties/${id}/classify`, null, { params: { classification } }),

  // ─── Ads ────────────────────────────────────────────────
  getPendingAds: () => api.get<AdminAd[]>('/v1/ads/pending'),
  approveAd: (id: number) => api.post(`/v1/ads/pending/${id}/approve`, { advertisementId: id, comment: 'Approved by admin' }),
  rejectAd: (id: number, reason?: string) => api.post(`/v1/ads/pending/${id}/reject`, { advertisementId: id, comment: reason || 'Rejected by admin' }),
  getAllAds: () => api.get<AdminAd[]>('/v1/admin/ads'),
  deleteAd: (id: number) => api.delete(`/v1/ads/${id}`),
  getAdPayments: () => api.get('/v1/ads/payments'),
  refundPayment: (id: number, reason: string) => api.post(`/v1/ads/payments/${id}/refund`, { reason }),

  // ─── Reviews ────────────────────────────────────────────
  getPendingReviews: (page = 0, size = 20) =>
    api.get<AdminReview[]>('/v1/reviews/moderation/pending', { params: { page, size } }),
  getFlaggedReviews: (page = 0, size = 20) =>
    api.get<AdminReview[]>('/v1/reviews/moderation/flagged', { params: { page, size } }),
  moderateReview: (reviewId: number, action: string, reason?: string) =>
    api.post('/v1/reviews/moderation/action', { reviewId, action, reason }),

  // ─── Events / Logs ──────────────────────────────────────
  getEventLogs: (eventType?: string, page = 0, size = 50) =>
    api.get('/v1/admin/events', { params: { eventType, page, size } }),
  getEventSummary: (days = 7) =>
    api.get('/v1/admin/events/summary', { params: { days } }),
  getTopViewedProperties: (days = 7, limit = 10) =>
    api.get('/v1/admin/events/top-viewed', { params: { days, limit } }),

  // ─── Fraud ──────────────────────────────────────────────
  checkFraud: (propertyId: number) =>
    api.post(`/v1/fraud/check/${propertyId}`),
  getFraudDashboard: () => api.get('/v1/fraud-review/dashboard'),

  // ─── Analytics ──────────────────────────────────────────
  getAdminAnalytics: () => api.get<AdminAnalyticsDTO>('/v1/analytics/admin/platform'),
  getMonthlyAnalytics: () => api.get<MonthlyPoint[]>('/v1/analytics/admin/monthly'),
  getYearlyAnalytics: () => api.get<YearlyPoint[]>('/v1/analytics/admin/yearly'),
  getRevenueAnalytics: (period = 'month') => api.get('/v1/analytics/revenue', { params: { period } }),

  // ─── Seed ───────────────────────────────────────────────
  seedDatabase: () => api.post('/v1/admin/seed'),
};
