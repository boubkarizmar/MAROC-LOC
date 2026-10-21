import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';

export interface PlatformStats {
  verifiedProperties: number;
  activeUsers: number;
  averageResponseTimeMinutes: number;
  satisfactionRate: number;
}

export const usePlatformStats = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const response = await api.get<PlatformStats>('/v1/platform/stats');
      return response.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};
