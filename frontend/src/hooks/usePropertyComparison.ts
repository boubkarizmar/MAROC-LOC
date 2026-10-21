import { useState, useEffect, useCallback } from 'react';
import { Property } from '../types';

const STORAGE_KEY = 'marocloc_compare';
const MAX_COMPARE = 3;

function getValidArray<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export const usePropertyComparison = () => {
  const [compareList, setCompareList] = useState<Property[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  useEffect(() => {
    const valid = getValidArray<Property>(STORAGE_KEY);
    if (valid.length > 0) {
      setCompareList(valid);
    }
  }, []);

  const addToCompare = useCallback((property: Property) => {
    setCompareList((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (arr.some((p) => p.id === property.id)) return arr;
      if (arr.length >= MAX_COMPARE) return arr;
      const updated = [...arr, property];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCompare = useCallback((propertyId: number) => {
    setCompareList((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const updated = arr.filter((p) => p.id !== propertyId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCompare = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCompareList([]);
  }, []);

  const isInCompare = useCallback(
    (propertyId: number) => {
      const arr = Array.isArray(compareList) ? compareList : [];
      return arr.some((p) => p.id === propertyId);
    },
    [compareList]
  );

  const canAddMore = (Array.isArray(compareList) ? compareList : []).length < MAX_COMPARE;

  return {
    compareList,
    isComparisonOpen,
    setIsComparisonOpen,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore,
  };
};
