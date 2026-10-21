import api from './axiosConfig';

export interface PropertyReservation {
  id: number;
  propertyId: number;
  propertyTitle?: string;
  propertyCity?: string;
  propertyImageUrl?: string;
  transactionType: 'RESERVATION' | 'PURCHASE';
  amount: number;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

export const reservationApi = {
  getMyReservations: () => api.get<PropertyReservation[]>('/v1/reservations/my'),
  cancel: (id: number) => api.post<string>(`/v1/reservations/${id}/cancel`),
};
