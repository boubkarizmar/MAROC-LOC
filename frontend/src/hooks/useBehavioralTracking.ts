import { useEffect, useRef, useCallback } from 'react';
import api from '../api/axiosConfig';

interface TrackingConfig {
  propertyId: number;
  recommendationType?: string;
  matchScore?: number;
  position?: number;
  page?: string;
}

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
 * Track property view with dwell time.
 * Sends VIEW event when user leaves the page or after 5 seconds minimum.
 */
export const usePropertyViewTracking = (propertyId: number | null) => {
  const startTimeRef = useRef<number>(0);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!propertyId || trackedRef.current) return;
    startTimeRef.current = Date.now();

    const sendView = () => {
      if (trackedRef.current) return;
      const dwellTime = Date.now() - startTimeRef.current;
      if (dwellTime < 2000) return; // Minimum 2 seconds to count as a view

      trackedRef.current = true;
      api.post('/v1/recommendations/events', {
        eventType: 'VIEW',
        propertyId,
        sessionId: getSessionId(),
        page: window.location.pathname,
      }).catch(() => { /* silent fail */ });
    };

    // Track on page unload / navigation
    window.addEventListener('beforeunload', sendView);
    // Track after 5 seconds (if still on page)
    const timer = setTimeout(sendView, 5000);

    return () => {
      window.removeEventListener('beforeunload', sendView);
      clearTimeout(timer);
      sendView();
    };
  }, [propertyId]);
};

/**
 * Track recommendation card interactions (impressions, clicks, hover).
 */
export const useRecommendationTracking = () => {
  const impressionsRef = useRef<Set<number>>(new Set());
  const sessionId = getSessionId();

  const trackImpression = useCallback((configs: TrackingConfig[]) => {
    const newEvents = configs.filter(c => {
      const key = `${c.propertyId}-${c.recommendationType || 'unknown'}`;
      if (impressionsRef.current.has(c.propertyId)) return false;
      impressionsRef.current.add(c.propertyId);
      return true;
    }).map((c, i) => ({
      eventType: 'IMPRESSION',
      propertyId: c.propertyId,
      recommendationType: c.recommendationType || 'unknown',
      matchScore: c.matchScore || 0,
      position: c.position ?? i,
    }));

    if (newEvents.length === 0) return;

    api.post('/v1/recommendations/events/batch', {
      batchEvents: newEvents,
      sessionId,
      page: window.location.pathname,
    }).catch(() => { /* silent fail */ });
  }, [sessionId]);

  const trackClick = useCallback((config: TrackingConfig) => {
    api.post('/v1/recommendations/events', {
      eventType: 'CLICK',
      propertyId: config.propertyId,
      recommendationType: config.recommendationType || 'unknown',
      matchScore: config.matchScore || 0,
      position: config.position,
      sessionId,
      page: window.location.pathname,
    }).catch(() => { /* silent fail */ });
  }, [sessionId]);

  const trackDismiss = useCallback((config: TrackingConfig) => {
    api.post('/v1/recommendations/events', {
      eventType: 'DISMISS',
      propertyId: config.propertyId,
      recommendationType: config.recommendationType || 'unknown',
      matchScore: config.matchScore || 0,
      position: config.position,
      sessionId,
      page: window.location.pathname,
    }).catch(() => { /* silent fail */ });
  }, [sessionId]);

  return { trackImpression, trackClick, trackDismiss };
};

/**
 * Intersection Observer hook for tracking when elements come into view.
 */
export const useIntersectionTracking = (
  elementRef: React.RefObject<HTMLElement>,
  onIntersect: () => void,
  threshold = 0.5
) => {
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
          observer.disconnect(); // Track once
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [elementRef, onIntersect, threshold]);
};
