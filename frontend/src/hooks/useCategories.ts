import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../api/propertyApi';

export interface CategoryItem {
  value: string;
  label: string;
  count?: number;
}

export const useCategories = () => {
  return useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await propertyApi.getCategories();
      const data = response.data || [];
      return data.map((cat: string) => ({
        value: cat,
        label: cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      }));
    },
  });
};
