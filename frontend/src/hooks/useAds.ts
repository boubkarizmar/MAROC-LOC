import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { Advertisement } from '../api/advertisementApi';

export const useAds = (slot: string = 'homepage', limit: number = 3) => {
  return useQuery<Advertisement[]>({
    queryKey: ['ads', slot, limit],
    queryFn: async () => {
      const response = await api.get<Advertisement[]>(`/v1/ads/rotation?slot=${slot}&limit=${limit}`);
      return response.data || [];
    },
  });
};
