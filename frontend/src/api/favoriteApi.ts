import api from './axiosConfig';
import { Property } from '../types';

export const favoriteApi = {
  getAll: () =>
    api.get<Property[]>('/v1/favorites'),

  add: (propertyId: number) =>
    api.post(`/v1/favorites/${propertyId}`),

  remove: (propertyId: number) =>
    api.delete(`/v1/favorites/${propertyId}`),

  check: (propertyId: number) =>
    api.get<boolean>(`/v1/favorites/check/${propertyId}`),
};
