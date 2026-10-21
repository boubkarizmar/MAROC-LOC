import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';

export interface CityStat {
  name: string;
  slug: string;
  propertyCount: number;
  image?: string;
}

export const useCityStats = () => {
  return useQuery<CityStat[]>({
    queryKey: ['cityStats'],
    queryFn: async () => {
      const response = await api.get<CityStat[]>('/v2/properties/city-stats');
      return response.data || [];
    },
  });
};
