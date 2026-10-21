import { Property } from '../types';

export interface RecommendationItem {
  propertyId?: number;
  id?: number;
  title?: string;
  city?: string;
  address?: string;
  price?: number;
  propertyType?: string;
  type?: string;
  category?: string;
  customCategory?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  imageUrl?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  matchScore?: number;
  matchReasons?: string[];
  matchReason?: string;
  recommendationType?: string;
  viewCount?: number;
  favoriteCount?: number;
  averageRating?: number;
  reviewCount?: number;
  distanceKm?: number;
  listedAt?: string;
  createdAt?: string;
  ownerName?: string;
  ownerId?: number;
  status?: string;
  pricePerSquareMeter?: number;
  [key: string]: any;
}

/**
 * Normalize a backend recommendation/trending item into a Property object that
 * the existing PropertyCard / FavoritePropertyCard components can consume.
 *
 * Backend differences handled:
 * - `propertyId` instead of `id`
 * - `imageUrl` (string) instead of `images` (array)
 * - `propertyType` instead of `type`
 * - optional fields that PropertyCard expects (bedrooms, bathrooms, surface, etc.)
 */
export const normalizeRecommendation = (item: RecommendationItem): Property => {
  const id = item.id ?? item.propertyId ?? 0;
  const images = item.images ?? (item.imageUrl ? [item.imageUrl] : []);
  const type = (item.type ?? item.propertyType ?? 'RENT') as Property['type'];
  const category = (item.category ?? 'OTHER') as Property['category'];
  const status = (item.status ?? 'AVAILABLE') as Property['status'];

  return {
    ...item,
    id,
    title: item.title ?? '',
    city: item.city ?? '',
    address: item.address ?? '',
    price: item.price ?? 0,
    type,
    category,
    status,
    surface: item.surface ?? 0,
    rooms: item.surface ? Math.max(1, Math.round(item.surface / 30)) : 1,
    bedrooms: item.bedrooms ?? 0,
    bathrooms: item.bathrooms ?? 0,
    images,
    latitude: item.latitude ?? 0,
    longitude: item.longitude ?? 0,
    ownerId: item.ownerId ?? 0,
    ownerName: item.ownerName,
    createdAt: item.createdAt ?? item.listedAt ?? new Date().toISOString(),
    pricePerSquareMeter: item.pricePerSquareMeter,
    // Preserve recommendation-specific metadata for possible future use
    matchScore: item.matchScore,
    matchReasons: item.matchReasons ?? (item.matchReason ? [item.matchReason] : []),
    recommendationType: item.recommendationType,
    distanceKm: item.distanceKm,
  } as Property;
};

export const normalizeRecommendations = (items?: RecommendationItem[] | null): Property[] => {
  if (!items) return [];
  return items.map(normalizeRecommendation);
};

export const recommendationToProperty = normalizeRecommendation;
export const recommendationsToProperties = normalizeRecommendations;
