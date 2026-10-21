import { useQuery } from '@tanstack/react-query';
import { propertyApi, PaginatedResponse } from '../api/propertyApi';
import { Property, SearchFilters } from '../types';

interface UsePropertiesOptions {
  filters?: SearchFilters;
  page?: number;
  size?: number;
  sort?: string;
}

export const useProperties = (options: UsePropertiesOptions = {}) => {
  const { filters = {}, page = 0, size = 9, sort = 'createdAt,desc' } = options;

  return useQuery<PaginatedResponse<Property>>({
    queryKey: ['properties', filters, page, size, sort],
    queryFn: async () => {
      // FIX: strip undefined/null/empty values to avoid parasitic filters on backend
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
      );
      const response = await propertyApi.search({
        ...cleanFilters,
        page,
        size,
        sort,
      } as SearchFilters);
      return response.data;
    },
  });
};
