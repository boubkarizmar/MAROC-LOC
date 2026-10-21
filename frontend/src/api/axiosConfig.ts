import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { fixMediaUrl } from '../utils/imageUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Garantit qu'une seule requête de refresh est en cours à la fois
let refreshPromise: Promise<string> | null = null;

function parseJwtExp(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '=');
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

const performRefresh = async (refreshToken: string): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/v1/auth/refresh', { refreshToken })
      .then((refreshResponse) => {
        const { accessToken, refreshToken: rotatedRefreshToken } = refreshResponse.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('token_timestamp', Date.now().toString());
        if (rotatedRefreshToken) {
          localStorage.setItem('refreshToken', rotatedRefreshToken);
        }
        return accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Pré-renouvelle le token s'il est absent ou sur le point d'expirer.
// Utile avant de lancer un lot de requêtes pour éviter les 401 transitoires.
export const ensureValidToken = async (bufferSeconds = 60): Promise<string | null> => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!token) {
    if (refreshToken) {
      try {
        return await performRefresh(refreshToken);
      } catch {
        return null;
      }
    }
    return null;
  }
  const exp = parseJwtExp(token);
  if (!exp || Date.now() >= exp - bufferSeconds * 1000) {
    if (refreshToken) {
      try {
        return await performRefresh(refreshToken);
      } catch {
        return token;
      }
    }
  }
  return token;
};

// ─── Helpers pour la gestion d'auth robuste ─────────────────────────
const PUBLIC_API_ENDPOINTS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh',
  '/v2/properties',
  '/v1/ads',
  '/v1/platform/stats',
  '/v1/ai/',
];

function isPublicApiEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function shouldHardRedirect(): boolean {
  const path = window.location.pathname;
  // Ne jamais redirect hard depuis les pages auth (sinon on perd l'état React)
  if (path === '/login' || path === '/register') return false;
  // Ne pas redirect si l'utilisateur n'était pas connecté (guest browsing)
  return false; // On laisse la SPA gérer via event
}

// ─── Intercepteur Request ───────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token') || getTokenFromUser();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ne pas forcer Content-Type pour FormData
    if (config.method?.toLowerCase() === 'get') {
      delete config.headers['Content-Type'];
    } else if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.method?.toLowerCase() === 'post' || config.method?.toLowerCase() === 'put') {
      config.headers['Content-Type'] = 'application/json';
    }

    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

function getTokenFromUser(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.accessToken || user.token || null;
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  return null;
}

// ─── Intercepteur Response ──────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    if (response.data) {
      fixMediaUrls(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const { response, request, message, config } = error;

    if (import.meta.env.DEV) {
      console.error('[API Error]', error.response?.status, error.response?.data);
    }

    if (response) {
      const { status, data } = response;

      // ── 401 Unauthorized ─────────────────────────────────────────
      if (status === 401 && !((config as any)?._retry)) {
        const hadTokenBefore = !!localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken && config) {
          try {
            (config as any)._retry = true;
            const accessToken = await performRefresh(refreshToken);
            config.headers.Authorization = `Bearer ${accessToken}`;
            return api.request(config);
          } catch (refreshError) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // Dispatch event pour la SPA au lieu de redirect hard
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
        }

        // Pas de refresh token ou endpoint public : cleanup silencieux
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Ne pas redirect hard si on est sur login/register ou si c'était un guest
        if (hadTokenBefore && !isPublicApiEndpoint(config?.url)) {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return Promise.reject(new Error((data as any)?.message || 'Authentication required.'));
      }

      // ── 403 Forbidden ────────────────────────────────────────────
      if (status === 403) {
        if (import.meta.env.DEV) {
          console.error('403 Forbidden - URL:', response.config.url);
          console.error('403 Forbidden - Method:', response.config.method);
        }
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      }

      // ── 422 Validation ───────────────────────────────────────────
      if (status === 422 && data && typeof data === 'object' && 'fieldErrors' in data) {
        const fieldErrors = (data as any).fieldErrors;
        const errorMessages = Object.values(fieldErrors).join(', ');
        return Promise.reject(new Error(`Validation failed: ${errorMessages}`));
      }

      // ── Messages d'erreur génériques du backend ──────────────────
      if (data && typeof data === 'object' && 'message' in data) {
        return Promise.reject(new Error((data as any).message));
      }
    } else if (request) {
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    } else {
      return Promise.reject(new Error(message || 'An unexpected error occurred.'));
    }

    return Promise.reject(error);
  }
);

// ─── Fix des URLs médias ────────────────────────────────────────────
function fixMediaUrls(data: any): void {
  if (!data) return;

  if (Array.isArray(data)) {
    data.forEach(item => fixMediaUrls(item));
    return;
  }

  if (typeof data === 'object') {
    if (data.imageUrl && typeof data.imageUrl === 'string') {
      data.imageUrl = fixMediaUrl(data.imageUrl);
    }

    if (data.videoTour && typeof data.videoTour === 'string') {
      data.videoTour = fixMediaUrl(data.videoTour);
      if (import.meta.env.DEV) {
        console.log('VideoTour corrigé:', data.videoTour);
      }
    }

    if (data.videoUrl && typeof data.videoUrl === 'string') {
      data.videoUrl = fixMediaUrl(data.videoUrl);
    }

    if (Array.isArray(data.images)) {
      data.images = (data.images as string[])
        .filter(url => typeof url === 'string' && url.trim() !== '')
        .map(url => fixMediaUrl(url));
    }

    for (const key in data) {
      if (data[key] && typeof data[key] === 'object') {
        fixMediaUrls(data[key]);
      }
    }
  }
}

export default api;
