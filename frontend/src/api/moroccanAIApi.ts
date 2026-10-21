import axios from 'axios';
import { AIChatRequest, AIChatResponse, AISearchRequest, AISearchResponse } from '../types/ai';

// Use dedicated AI API URL if available, otherwise fallback to the main API base
const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000,
});

// Copy auth interceptor from main api
aiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
    return Promise.reject(error);
  }
);

export const moroccanAIApi = {
  chat: (payload: AIChatRequest) =>
    aiClient.post<AIChatResponse>('/smart/chat', {
      message: payload.message,
      sessionId: payload.sessionId,
      userRole: payload.userRole,
      language: payload.language,
    }),

  search: (query: string, topK = 10) =>
    aiClient.post<AISearchResponse>('/search', { query, topK }),

  voiceChat: (audioBlob: Blob, sessionId?: string, language?: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    if (sessionId) formData.append('sessionId', sessionId);
    if (language) formData.append('language', language);
    return aiClient.post<AIChatResponse>('/voice/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  transcribeVoice: (audioBlob: Blob, language?: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    if (language) formData.append('language', language);
    return aiClient.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getSessionHistory: (sessionId: string) =>
    aiClient.get(`/smart/session/${sessionId}`),

  clearSession: (sessionId: string) =>
    aiClient.delete(`/smart/session/${sessionId}`),

  tts: (text: string, language: string = 'french') =>
    aiClient.post('/analytics/tts', { text, language }),

  sendFeedback: (sessionId: string, helpful: boolean, userId?: string | number) =>
    aiClient.post('/rag/feedback', null, {
      params: {
        session_id: sessionId,
        helpful,
        ...(userId ? { user_id: String(userId) } : {}),
      },
    }),
};
