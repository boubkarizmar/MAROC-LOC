import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../api/propertyApi';

export const useCities = () => {
  return useQuery<string[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await propertyApi.getDistinctCities();
      return response.data || [];
    },
  });
};
