import axios from 'axios';
import api from './axiosConfig';

export interface ScheduleVisitRequest {
  propertyId: number;
  visitDate: string;
  visitTime: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  notes?: string;
}

export interface PropertyVisitDTO {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyCity: string;
  visitorId: number;
  visitorName: string;
  ownerId: number;
  ownerName: string;
  visitDate: string;
  visitTime: string;
  status: string;
  notes: string;
  visitorPhone: string;
  visitorEmail: string;
  createdAt: string;
}

export const visitApi = {
  schedule: (data: ScheduleVisitRequest) => api.post('/v1/visits', data),
  getMyVisits: () => api.get('/v1/visits/my-visits'),
  getOwnerVisits: () => api.get('/v1/visits/owner-visits'),
  updateStatus: (visitId: number, status: string) =>
    api.put(`/v1/visits/${visitId}/status?status=${status}`),
  cancelVisit: (visitId: number) => api.delete(`/v1/visits/${visitId}`),
  cancel: (visitId: number) => api.delete(`/v1/visits/${visitId}`),
};
