import api from './axiosConfig';
import { AuthResponse, User } from '../types';

// Ajouter cette interface si elle n'existe pas
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  fullName: string;
  city: string;
  phone: string;
  email: string;
  password: string;
  role: 'LOCATAIRE' | 'PROPRIETAIRE';
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/v1/auth/login', { email, password }),

  register: (payload: RegisterPayload) =>
    api.post<LoginResponse>('/v1/auth/register', payload),

  refresh: (refreshToken: string) =>
    api.post<LoginResponse>('/v1/auth/refresh', { refreshToken }),

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};
