export interface AIPropertySource {
  id: string;
  propertyId?: string;
  title: string;
  city: string;
  price: number;
  type: string;
  distance: number;
  url?: string;
  imageUrl?: string;
}

export interface AIQuickReply {
  label: string;
  action: string;
}

export interface AIAction {
  type: 'button' | 'slider' | 'link';
  label: string;
  action: string;
  min?: number;
  max?: number;
  default?: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: AIPropertySource[];
  quickReplies?: AIQuickReply[];
  actions?: AIAction[];
  intent?: string;
  detectedRole?: string;
}

export interface AIChatRequest {
  message: string;
  sessionId?: string;
  userRole?: 'locataire' | 'proprietaire' | 'admin' | null;
  language?: 'auto' | 'darija' | 'arabic' | 'french' | 'english';
}

export interface AIChatResponse {
  response: string;
  role: string;
  intent: string;
  confidence: number;
  language: string;
  entities: Record<string, unknown>;
  quick_replies: AIQuickReply[];
  actions: AIAction[];
  properties: Array<{
    id: string;
    title: string;
    city: string;
    price: number;
    type: string;
  }>;
  sessionId: string;
  sources?: Array<{
    id: string;
    property_id?: string;
    propertyId?: string;
    document: string;
    metadata: Record<string, unknown>;
    distance: number;
    url?: string;
  }>;
  property_ids?: string[];
  propertyIds?: string[];
  transcript?: string;
  filters?: Record<string, unknown>;
}

export interface AISearchRequest {
  query: string;
  topK?: number;
  filters?: Record<string, unknown>;
}

export interface AISearchResult {
  id: string;
  document: string;
  metadata: {
    title: string;
    city: string;
    neighborhood: string;
    price: number;
    bedrooms: number;
    area_sqm: number;
    type: string;
    language: string;
    [key: string]: unknown;
  };
  distance: number;
}

export interface AISearchResponse {
  results: AISearchResult[];
  total: number;
}

export interface AIVoiceResponse {
  text: string;
  languageDetected: string | null;
  confidence: number;
}
