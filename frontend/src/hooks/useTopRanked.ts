import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import { Property } from '../types';

export interface ScoreBreakdown {
  engagement: number;
  favorites: number;
  messages: number;
  reviews: number;
  conversion: number;
  freshness: number;
  trust: number;
}

export interface TopRankedProperty extends Property {
  finalScore: number;
  scoreBreakdown: ScoreBreakdown;
  trend: number;
  rank: number;
}

export interface TopRankedResponse {
  content: TopRankedProperty[];
}

export const useTopRanked = (limit: number = 6) => {
  return useQuery<TopRankedProperty[]>({
    queryKey: ['topRanked', limit],
    queryFn: async () => {
      const response = await api.get<TopRankedResponse>(`/v2/properties/top-ranked?limit=${limit}`);
      return response.data?.content || [];
    },
  });
};
