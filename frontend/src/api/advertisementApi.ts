import api from './axiosConfig';
import { Property } from '../types';

export type AdvertisementType = 'BANNER' | 'PROMOTED' | 'PROPERTY';

export interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  type: AdvertisementType;
  propertyId?: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  priority: number;
  property?: Property;
}

export interface AdvertisementPlan {
  tier: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: string[];
  current: boolean;
}

export interface AdvertisementDTO {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl?: string;
  advertiserId: number;
  advertiserName: string;
  type: 'BANNER' | 'SPONSOR' | 'FEATURED';
  isActive: boolean;
  startDate: string;
  endDate: string;
  budget: number;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export interface AdvertisementPaymentDTO {
  id: number;
  advertisementId: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface BackendAdvertisementPlan {
  name: string;
  displayName: string;
  description: string;
  amountMinorUnits: number;
  maxProperties: number;
  maxImages: number;
  videoAllowed: boolean;
  homepagePlacement: boolean;
  featuredBadge: boolean;
  supportsAdvancedTargeting: boolean;
  durationDays: number;
}

export interface AdvertisementRequestPayload {
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  type: 'BANNER' | 'SPONSOR' | 'FEATURED';
  plan: string;
  propertyIds: number[];
  propertyId?: number;
  startDate: string;
  endDate: string;
  budget: number;
  currency?: string;
  targetAudience?: string;
  paymentReference?: string;
}

export const advertisementApi = {
  getPlans: () =>
    api.get<BackendAdvertisementPlan[]>('/v1/ads/plans'),

  getMyAds: () =>
    api.get<AdvertisementDTO[]>('/v1/ads/user'),

  getPaymentHistory: () =>
    api.get<AdvertisementPaymentDTO[]>('/v1/ads/payments'),

  submitAdRequest: (data: AdvertisementRequestPayload) =>
    api.post<AdvertisementDTO>('/v1/ads/requests', data),

  createCheckoutSession: (data: {
    plan: string;
    propertyIds: number[];
    targetAudience?: string;
    durationMonths?: number;
    successUrl?: string;
    cancelUrl?: string;
  }) =>
    api.post<{ checkoutUrl: string; sessionId: string; sagaId: string; advertisementId?: number }>('/v1/ads/checkout', data),
};
