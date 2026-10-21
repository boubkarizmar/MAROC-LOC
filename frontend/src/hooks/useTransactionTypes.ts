import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../api/propertyApi';

export interface TransactionType {
  value: string;
  label: string;
}

export const useTransactionTypes = () => {
  return useQuery<TransactionType[]>({
    queryKey: ['transactionTypes'],
    queryFn: async () => {
      const response = await propertyApi.getTransactionTypes();
      const data = response.data || [];
      return data.map((type: string) => ({
        value: type,
        label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      }));
    },
  });
};
