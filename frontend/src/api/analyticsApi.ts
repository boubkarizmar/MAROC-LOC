import api from './axiosConfig';

export interface OwnerDashboardData {
  ownerId: number;
  ownerName: string;
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  totalPropertyViews: number;
  totalFavorites: number;
  totalInquiries: number;
  averageRating: number;
  totalReviews: number;
  newReviewsThisMonth: number;
  totalAdSpend: number;
  adRevenueThisMonth: number;
  activeAds: number;
  totalAds: number;
  topProperties: Array<{
    id: number;
    title: string;
    views: number;
    city: string;
    price: number;
  }>;
  propertyViewsTrend: Array<Record<string, any>>;
  inquiryTrend: Array<Record<string, any>>;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export const analyticsApi = {
  getOwnerDashboard: () =>
    api.get<OwnerDashboardData>('/v1/analytics/owner/dashboard'),

  // Admin charts
  getDailyActiveUsers: (days = 30) =>
    api.get<ChartDataPoint[]>('/v1/analytics/charts/dau', { params: { days } }),
  getPropertyViewsTrend: (days = 30) =>
    api.get<ChartDataPoint[]>('/v1/analytics/charts/property-views', { params: { days } }),
  getSearchTrend: (days = 30) =>
    api.get<ChartDataPoint[]>('/v1/analytics/charts/searches', { params: { days } }),
  getMessageTrend: (days = 30) =>
    api.get<ChartDataPoint[]>('/v1/analytics/charts/messages', { params: { days } }),
  getRevenueTrend: (days = 30) =>
    api.get<ChartDataPoint[]>('/v1/analytics/charts/revenue', { params: { days } }),
  getReviewTrend: (days = 30) =>
    api.get<ChartDataPoint[]>('/v1/analytics/charts/reviews', { params: { days } }),

  // Events
  getTopProperties: (days = 7) =>
    api.get('/v1/events/analytics/top-properties', { params: { days } }),
  getTopSearches: (days = 7) =>
    api.get('/v1/events/analytics/top-searches', { params: { days } }),
  getEngagementSummary: () =>
    api.get('/v1/events/analytics/engagement'),
};
