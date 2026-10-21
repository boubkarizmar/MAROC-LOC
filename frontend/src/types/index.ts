// ==================== TYPES COMPLETS POUR MAROC-LOC ====================

// ===== ÉNUMÉRATIONS =====
export type PropertyType = 'RENT' | 'BUY' | 'MORTGAGE';
export type PropertyCategory = 'CAFE' | 'GYM' | 'SHOP' | 'OFFICE' | 'HOUSE' | 'APARTMENT' | 'LAND' | 'RIAD' | 'OTHER';
export type PropertyStatus = 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'REJECTED' | 'RESERVED' | 'RENTED';
export type PropertyCondition = 'NEW' | 'GOOD' | 'RENOVATED' | 'NEEDS_REPAIR' | 'TO_RENOVATE';
export type Role = 'ADMIN' | 'LOCATAIRE' | 'PROPRIETAIRE';
export type SunDirection = 'EAST' | 'WEST' | 'SOUTH' | 'NORTH';
export type PaymentMethod = 'CMI' | 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'CHECK' | 'OTHER';
export type BillingPeriod = 'MONTH' | 'DAY' | 'TOTAL';

// ===== UTILISATEUR =====
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Non inclus dans les réponses API
  role: Role;

  // Champs de vérification
  firstNameArabic?: string;
  lastNameArabic?: string;
  firstNameLatin?: string;
  lastNameLatin?: string;
  fullName?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  cin?: string;
  cinImageUrl?: string;
  city?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  // Préférences utilisateur
  preferredCity?: string;
  minBudget?: number;
  maxBudget?: number;
}

// ===== PROPRIÉTÉ =====
export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;

  // Types et catégories
  type: PropertyType;
  category: PropertyCategory;
  customCategory?: string;
  status: PropertyStatus;
  billingPeriod?: BillingPeriod;

  // Caractéristiques physiques
  surface: number;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  floorNumber?: number;
  totalFloors?: number;
  buildingAge?: number;
  constructionYear?: number;
  condition?: PropertyCondition;
  furnished?: boolean;

  // Équipements
  hasElevator?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  hasAirConditioning?: boolean;
  hasInternet?: boolean;
  hasSecurity?: boolean;
  hasBalcony?: boolean;
  petAllowed?: boolean;

  // Environnement
  cityCenter?: boolean;
  nearSchool?: boolean;
  nearUniversity?: boolean;
  nearMosque?: boolean;
  nearHospital?: boolean;
  nearMarket?: boolean;
  nearTram?: boolean;
  nearBus?: boolean;
  nearTrainStation?: boolean;

  // Quartier
  popularArea?: boolean;
  modernArea?: boolean;
  quietArea?: boolean;
  familyArea?: boolean;

  // Orientation et vues
  sunDirection?: SunDirection;
  gardenView?: boolean;
  streetView?: boolean;
  seaView?: boolean;

  // Média
  images?: string[];
  videoTour?: string;

  // Localisation GPS
  latitude: number;
  longitude: number;

  // Propriétaire
  ownerId: number;
  ownerName?: string;

  // Contact
  phoneNumber?: string;
  whatsappNumber?: string;

  // Frais et remises
  additionalFees?: number;
  discountPercentage?: number;

  // Paiement
  paymentMethod?: PaymentMethod;

  // Dates
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Validation et statistiques
  isVerified?: boolean;
  viewCount?: number;
  interestedCount?: number;

  // Propriétaire enrichi
  owner?: {
    createdAt?: string;
    propertiesCount?: number;
    responseRate?: number;
    responseTime?: string;
    isPro?: boolean;
  };

  // Propriétés calculées
  finalPrice?: number;
  pricePerSquareMeter?: number;
}

// ===== PAYLOADS DE CRÉATION =====
export interface CreatePropertyPayload {
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  latitude: number;
  longitude: number;

  // Types et catégories
  type: PropertyType;
  category: PropertyCategory;
  customCategory?: string;
  billingPeriod?: BillingPeriod;

  // Caractéristiques physiques
  surface: number;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  floorNumber?: number;
  totalFloors?: number;
  buildingAge?: number;
  constructionYear?: number;
  condition?: PropertyCondition;
  furnished?: boolean;

  // Équipements
  hasElevator?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  hasAirConditioning?: boolean;
  hasInternet?: boolean;
  hasSecurity?: boolean;
  hasBalcony?: boolean;
  petAllowed?: boolean;

  // Environnement
  cityCenter?: boolean;
  nearSchool?: boolean;
  nearUniversity?: boolean;
  nearMosque?: boolean;
  nearHospital?: boolean;
  nearMarket?: boolean;
  nearTram?: boolean;
  nearBus?: boolean;
  nearTrainStation?: boolean;

  // Quartier
  popularArea?: boolean;
  modernArea?: boolean;
  quietArea?: boolean;
  familyArea?: boolean;

  // Orientation et vues
  sunDirection?: SunDirection;
  gardenView?: boolean;
  streetView?: boolean;
  seaView?: boolean;

  // Média
  images?: File[];
  videoTour?: File;

  // Contact
  phoneNumber?: string;
  whatsappNumber?: string;

  // Frais et remises
  additionalFees?: number;
  discountPercentage?: number;

  // Paiement
  paymentMethod?: PaymentMethod;

  // Informations propriétaire (pour création)
  firstNameArabic: string;
  lastNameArabic: string;
  firstNameLatin: string;
  lastNameLatin: string;
  cin?: string;
  cinImage?: File;
}

// ===== AUTHENTIFICATION =====
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  fullName: string;
  city: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  userId: number;
  name: string;
  email: string;
  role: Role;
}

// ===== AVIS ET MESSAGES =====
export interface Review {
  id: number;
  rating: number;
  comment: string;
  userId: number;
  userName: string;
  propertyId: number;
  createdAt: string;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderRole?: string;
  receiverId: number;
  receiverName: string;
  receiverRole?: string;
  content: string;
  isRead: boolean;
  timestamp: string;
  createdAt?: string;
  propertyId?: number;
  propertyTitle?: string;
}

export interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerAvatar?: string;
  partnerRole?: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  propertyId?: number;
  propertyTitle?: string;
}

// ===== CHATBOT ET IA =====
export interface ChatbotRequest {
  message: string;
  context?: {
    userId?: number;
    currentCity?: string;
    budget?: {
      min?: number;
      max?: number;
    };
  };
}

export interface ChatbotResponse {
  response: string;
  extractedCity?: string;
  extractedMinPrice?: number;
  extractedMaxPrice?: number;
  extractedPropertyType?: string;
  intent?: string;
}

// ===== RECOMMANDATIONS =====
export interface RecommendationResponse {
  userId: number;
  strategy: string;
  recommendations: PropertyRecommendation[];
  explanation: string;
}

export interface PropertyRecommendation {
  propertyId: number;
  title: string;
  matchScore: number;
  matchReason: string;
}

// ===== FAVORIS =====
export interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  createdAt: string;
  property?: Property; // Propriété complète optionnelle
}

// ===== PUBLICITÉS =====
export interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl?: string;
  advertiserId: number;
  advertiserName: string;
  type: AdvertisementType;
  isActive: boolean;
  startDate: string;
  endDate: string;
  budget: number;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export type AdvertisementType = 'BANNER' | 'SPONSOR' | 'FEATURED';

// ===== FILTRES DE RECHERCHE =====
export interface SearchFilters {
  query?: string;
  keyword?: string;
  city?: string;
  ownerId?: number;
  minPrice?: number;
  maxPrice?: number;
  /** Transaction type (RENT / BUY / MORTGAGE). Kept for backward compatibility. */
  propertyType?: PropertyType;
  /** Transaction type (RENT / BUY / MORTGAGE). Prefer this key in new code. */
  type?: PropertyType;
  category?: PropertyCategory;
  minSurface?: number;
  maxSurface?: number;
  minRooms?: number;
  maxRooms?: number;
  furnished?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasElevator?: boolean;
  hasAirConditioning?: boolean;
  hasInternet?: boolean;
  hasSecurity?: boolean;
  hasBalcony?: boolean;
  /** Backend search accepts gardenView, not hasGarden. */
  gardenView?: boolean;
  petAllowed?: boolean;
  condition?: PropertyCondition;
  sunDirection?: SunDirection;
  cityCenter?: boolean;
  nearSchool?: boolean;
  nearUniversity?: boolean;
  nearMosque?: boolean;
  nearHospital?: boolean;
  nearMarket?: boolean;
  nearTram?: boolean;
  nearBus?: boolean;
  nearTrainStation?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

// ===== RÉPONSES API GÉNÉRIQUES =====
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ===== STATISTIQUES =====
export interface PropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  averagePrice: number;
  averagePricePerSqm: number;
  propertiesByCity: Record<string, number>;
  propertiesByCategory: Record<PropertyCategory, number>;
  propertiesByType: Record<PropertyType, number>;
}

export interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  usersByRole: Record<Role, number>;
  usersByCity: Record<string, number>;
}

// ===== VALIDATION =====
export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

export interface ApprovePropertyRequest {
  propertyId: number;
  approved: boolean;
  rejectionReason?: string;
}

export interface RejectPropertyRequest {
  propertyId: number;
  reason: string;
}

// ===== AI RESPONSE =====
export interface AIResponse {
  response: string;
  confidence?: number;
  sources?: string[];
  timestamp?: string;
}

export interface SiteReview {
  id: number;
  rating: number;
  comment: string;
  userName: string;
  userEmail: string;
  status: string;
  createdAt: string;
}

export interface CreateSiteReviewRequest {
  rating: number;
  comment: string;
  userName?: string;
  userEmail?: string;
}

export interface SiteReviewStats {
  averageRating: number;
  totalReviews: number;
}