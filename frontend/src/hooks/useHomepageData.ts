import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'content' in value && Array.isArray((value as any).content)) {
    return (value as any).content as T[];
  }
  return [];
}

export interface CategoryCount {
  category: string;
  count: number;
  growthRate?: number;
}

export interface CityStatsDetailed {
  name: string;
  slug: string;
  propertyCount: number;
  averagePrice: number;
}

export interface VerifiedReview {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  userAvatar: string | null;
  city: string;
  createdAt: string;
}

export interface PlatformReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

export interface OwnerRanking {
  userId: number;
  name: string;
  avatar: string | null;
  city: string | null;
  propertyCount: number;
  averageRating: number;
  reviewCount: number;
  responseRate: number;
  premiumAdCount: number;
  visitCount: number;
  verified: boolean;
  score: number;
}

export interface AnimatedStats {
  totalUsers: number;
  totalOwners: number;
  totalProperties: number;
  totalAds: number;
  totalRentals: number;
  totalCities: number;
}

export interface ActiveAd {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  type: string;
  plan: string;
  status: string;
  priority: number;
  budget: number;
  propertyId?: number;
  createdAt: string;
}

// Category counts
export const useCategoryCounts = () =>
  useQuery<CategoryCount[]>({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const res = await api.get('/v2/properties/category-counts');
      return asArray<CategoryCount>(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

// City stats detailed
export const useCityStatsDetailed = () =>
  useQuery<CityStatsDetailed[]>({
    queryKey: ['city-stats-detailed'],
    queryFn: async () => {
      const res = await api.get('/v2/properties/city-stats/detailed');
      return asArray<CityStatsDetailed>(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

// Verified reviews
export const useVerifiedReviews = () =>
  useQuery<VerifiedReview[]>({
    queryKey: ['verified-reviews'],
    queryFn: async () => {
      const res = await api.get('/v1/reviews/verified');
      return asArray<VerifiedReview>(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

// Platform review stats
export const usePlatformReviewStats = () =>
  useQuery<PlatformReviewStats>({
    queryKey: ['platform-review-stats'],
    queryFn: async () => {
      const res = await api.get('/v1/reviews/platform-stats');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

// Owner rankings
export const useOwnerRankings = () =>
  useQuery<OwnerRanking[]>({
    queryKey: ['owner-rankings'],
    queryFn: async () => {
      const res = await api.get('/v2/properties/owner-rankings');
      return asArray<OwnerRanking>(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

// Active ads
export const useActiveAds = () =>
  useQuery<ActiveAd[]>({
    queryKey: ['active-ads'],
    queryFn: async () => {
      const res = await api.get('/v1/ads/active');
      return asArray<ActiveAd>(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

// Animated stats
export const useAnimatedStats = () =>
  useQuery<AnimatedStats>({
    queryKey: ['animated-stats'],
    queryFn: async () => {
      const res = await api.get('/v1/platform/stats/animated');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
