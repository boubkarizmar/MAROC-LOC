import api from './axiosConfig';
import { Property, SearchFilters } from '../types';

// Backend paginated response interface
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const propertyApi = {
  getAll: () => api.get<PaginatedResponse<Property>>('/v2/properties'),

  getById: (id: number) => api.get<Property>(`/v2/properties/${id}`),

  search: (params: SearchFilters) => {
    const searchParams = { ...params } as any;
    // Backend expects the transaction type under `type` and property category under `category`.
    // The frontend historically used `propertyType`; accept both and normalize to `type`.
    const transactionType = params.type || params.propertyType;
    if (transactionType) {
      searchParams.type = transactionType;
    }
    delete searchParams.propertyType;

    // Backend accepts gardenView, not hasGarden.
    if (searchParams.hasGarden) {
      searchParams.gardenView = searchParams.hasGarden;
      delete searchParams.hasGarden;
    }

    // Strip undefined/null/empty/false values to avoid parasitic filters.
    // Boolean filters are only meaningful when true.
    Object.keys(searchParams).forEach((k) => {
      if (
        searchParams[k] === undefined ||
        searchParams[k] === null ||
        searchParams[k] === '' ||
        searchParams[k] === false
      ) {
        delete searchParams[k];
      }
    });
    return api.get<PaginatedResponse<Property>>('/v2/properties/search', { params: searchParams });
  },

  getDistinctCities: () => api.get<string[]>('/v2/properties/cities'),

  // ✅ CORRECTED: Use / endpoint with FormData for full multipart upload
  // Note: Don't set Content-Type header manually - let axios handle it with FormData
  create: (data: FormData) =>
    api.post<Property>('/v2/properties', data),

  // ✅ AJOUTER CETTE MÉTHODE POUR LA CRÉATION JSON
  createPropertyJson: (data: any) =>
    api.post<Property>('/v2/properties/json', data),

  update: (id: number, data: Partial<Property>) =>
    api.put<Property>(`/v2/properties/${id}`, data),

  updateWithImages: (id: number, data: Partial<Property>, images: File[], existingImageUrls?: string[]) => {
    const formData = new FormData();
    formData.append('property', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    images.forEach(img => formData.append('images', img));
    if (existingImageUrls) {
      existingImageUrls.forEach(url => formData.append('existingImages', url));
    }
    return api.put<Property>(`/v2/properties/${id}/with-images`, formData);
  },

  delete: (id: number) => api.delete(`/v2/properties/${id}`),

  // ✅ FIXED: Handle Spring Boot Page response with pagination params
  getMyProperties: (page: number = 0, size: number = 20) =>
    api.get<PaginatedResponse<Property>>('/v2/properties/my-properties', {
      params: { page, size }
    }),

  getRecommendations: (limit?: number) => api.get<Property[]>(`/v1/recommendations/personalized?limit=${limit || 12}`),

  getSimilarProperties: (propertyId: number, limit?: number) =>
    api.get<Property[]>(`/v1/recommendations/similar/${propertyId}?limit=${limit || 8}`),

  getTrendingProperties: (period?: string, limit?: number) =>
    api.get<Property[]>(`/v1/recommendations/trending?period=${period || 'week'}&limit=${limit || 10}`),

  getNearbyProperties: (lat: number, lng: number, radiusKm?: number, limit?: number) =>
    api.get<Property[]>(`/v1/recommendations/nearby?latitude=${lat}&longitude=${lng}&radiusKm=${radiusKm || 10}&limit=${limit || 12}`),

  getCategories: () => api.get<string[]>('/v2/properties/categories'),

  getTransactionTypes: () => api.get<string[]>('/v2/properties/transaction-types'),
};

// Helper function to create a property with images and video
export const createPropertyWithImagesAndVideo = async (propertyObject: Property, images: File[], video: File | null) => {
  const formData = new FormData();
  formData.append('property', new Blob([JSON.stringify(propertyObject)], { type: 'application/json' }));
  images.forEach((img) => formData.append('images', img));
  if (video) formData.append('video', video);
  await propertyApi.create(formData);
};
