import axios from 'axios';

const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GenerateDescriptionRequest {
  title: string;
  city: string;
  category: string;
  propertyType: 'RENT' | 'BUY' | 'MORTGAGE';
  surface: number;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  hasAirConditioning?: boolean;
  hasInternet?: boolean;
  hasSecurity?: boolean;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  cityCenter?: boolean;
  nearSchool?: boolean;
  nearUniversity?: boolean;
  nearMosque?: boolean;
  nearHospital?: boolean;
  nearTram?: boolean;
  nearBus?: boolean;
  nearTrainStation?: boolean;
  seaView?: boolean;
  gardenView?: boolean;
  quietArea?: boolean;
  familyArea?: boolean;
  modernArea?: boolean;
  language?: 'fr' | 'ar' | 'en';
  tone?: 'professional' | 'friendly' | 'luxury' | 'concise';
}

export interface GenerateDescriptionResponse {
  description: string;
  highlights: string[];
  language: string;
  char_count: number;
  word_count: number;
}

export interface SuggestPriceRequest {
  city: string;
  category: string;
  propertyType: 'RENT' | 'BUY' | 'MORTGAGE';
  surface: number;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  hasAirConditioning?: boolean;
  hasElevator?: boolean;
  cityCenter?: boolean;
  nearTram?: boolean;
  seaView?: boolean;
  condition?: 'NEW' | 'GOOD' | 'RENOVATED' | 'TO_RENOVATE';
  buildingAge?: number;
}

export interface SuggestPriceResponse {
  suggested_price: number;
  price_range_min: number;
  price_range_max: number;
  price_per_sqm: number;
  confidence: 'high' | 'medium' | 'low';
  market_trend: 'up' | 'stable' | 'down';
  factors: Array<{ name: string; impact: string; positive: boolean }>;
  comparable_count: number;
}

export const aiApi = {
  generateDescription: (data: GenerateDescriptionRequest) =>
    aiClient.post<GenerateDescriptionResponse>('/owner/generate-description', data),

  suggestPrice: (data: SuggestPriceRequest) =>
    aiClient.post<SuggestPriceResponse>('/owner/suggest-price', data),
};
