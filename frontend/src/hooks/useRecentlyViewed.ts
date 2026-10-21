import { useState, useEffect, useCallback } from 'react';
import { Property } from '../types';

const STORAGE_KEY = 'marocloc_recently_viewed';
const MAX_ITEMS = 10;

function getValidArray<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<Property[]>([]);

  useEffect(() => {
    const valid = getValidArray<Property>(STORAGE_KEY);
    if (valid.length > 0) {
      setRecentlyViewed(valid);
    }
  }, []);

  const addToRecentlyViewed = useCallback((property: Property) => {
    setRecentlyViewed((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const filtered = arr.filter((p) => p.id !== property.id);
      const updated = [property, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentlyViewed([]);
  }, []);

  return { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed };
};
