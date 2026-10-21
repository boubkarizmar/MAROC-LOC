import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteReviewApi } from '../api/siteReviewApi';
import { CreateSiteReviewRequest } from '../types';

export const useSiteReviews = () => {
  return useQuery({
    queryKey: ['siteReviews'],
    queryFn: async () => {
      const response = await siteReviewApi.getApproved();
      return response.data;
    },
  });
};

export const useSiteReviewStats = () => {
  return useQuery({
    queryKey: ['siteReviewStats'],
    queryFn: async () => {
      const response = await siteReviewApi.getStats();
      return response.data;
    },
  });
};

export const useSubmitSiteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSiteReviewRequest) => siteReviewApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteReviews'] });
      queryClient.invalidateQueries({ queryKey: ['siteReviewStats'] });
    },
  });
};
