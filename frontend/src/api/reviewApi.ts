import api from './axiosConfig';
import { Review } from '../types';

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export const reviewApi = {
  create: (propertyId: number, data: CreateReviewRequest) =>
    api.post<Review>(`/v1/reviews/property/${propertyId}`, data),

  getByProperty: (propertyId: number) =>
    api.get<Review[]>(`/v1/reviews/property/${propertyId}`),

  getAverage: (propertyId: number) =>
    api.get<number>(`/v1/reviews/property/${propertyId}/average`),

  getMyReviews: () =>
    api.get<Review[]>('/v1/reviews/my-reviews'),

  update: (reviewId: number, data: CreateReviewRequest) =>
    api.put<Review>(`/v1/reviews/${reviewId}`, data),

  delete: (reviewId: number) =>
    api.delete(`/v1/reviews/${reviewId}`),
};
