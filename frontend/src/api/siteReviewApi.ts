import api from './axiosConfig';
import { SiteReview, CreateSiteReviewRequest, SiteReviewStats } from '../types';

export const siteReviewApi = {
  getApproved: () => api.get<SiteReview[]>('/v1/reviews/site'),
  getStats: () => api.get<SiteReviewStats>('/v1/reviews/site/stats'),
  create: (data: CreateSiteReviewRequest) => api.post<SiteReview>('/v1/reviews/site', data),
};
