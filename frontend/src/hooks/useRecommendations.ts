import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { Property } from '../types';

export interface RecommendationItem extends Property {
  matchScore: number;
  matchReasons: string[];
  recommendationType: string;
  distanceKm?: number;
}

// Generate or retrieve session ID for anonymous tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('marocloc_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('marocloc_session_id', sid);
  }
  return sid;
}

/**
 * Personalized recommendations — works for BOTH authenticated and anonymous users.
 * Authenticated: uses full hybrid recommendation engine
 * Anonymous: uses discover endpoint with session-based tracking
 */
export const useRecommendations = (limit: number = 8) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const sessionId = getSessionId();

  return useQuery<RecommendationItem[]>({
    queryKey: ['recommendations', 'personalized', token ? 'auth' : 'anon', limit],
    queryFn: async () => {
      try {
        if (token) {
          const response = await api.get<RecommendationItem[]>(`/v1/recommendations/personalized?limit=${limit}`);
          return response.data || [];
        } else {
          // Anonymous users get discover recommendations
          const response = await api.get<RecommendationItem[]>(
            `/v1/recommendations/discover?limit=${limit}&sessionId=${encodeURIComponent(sessionId)}`
          );
          return response.data || [];
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Recommendations fetch failed:', err);
        }
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const useSimilarProperties = (propertyId: number | null, limit: number = 6) => {
  return useQuery<RecommendationItem[]>({
    queryKey: ['recommendations', 'similar', propertyId, limit],
    queryFn: async () => {
      if (!propertyId) return [];
      const response = await api.get<RecommendationItem[]>(`/v1/recommendations/similar/${propertyId}?limit=${limit}`);
      return response.data || [];
    },
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useTrendingProperties = (period: string = 'week', limit: number = 8) => {
  return useQuery<RecommendationItem[]>({
    queryKey: ['recommendations', 'trending', period, limit],
    queryFn: async () => {
      const response = await api.get<RecommendationItem[]>(`/v1/recommendations/trending?period=${period}&limit=${limit}`);
      return response.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Track recommendation feedback (click, save, dismiss)
 */
export const useRecommendationFeedback = () => {
  return useMutation({
    mutationFn: async (payload: { propertyId: number; feedbackType: 'click' | 'save' | 'dismiss' }) => {
      const response = await api.post('/v1/recommendations/feedback', payload);
      return response.data;
    },
  });
};

/**
 * Track recommendation events (impressions, clicks, dismissals)
 */
export const useTrackRecommendationEvents = () => {
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async (events: Array<{
      eventType: string;
      propertyId: number;
      recommendationType?: string;
      matchScore?: number;
      position?: number;
    }>) => {
      const response = await api.post('/v1/recommendations/events/batch', {
        batchEvents: events,
        sessionId,
        page: window.location.pathname,
      });
      return response.data;
    },
  });
};
