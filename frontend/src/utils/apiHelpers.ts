import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export interface ApiError {
  message: string;
  errorCode?: string;
  traceId?: string;
  suggestion?: string;
  validationErrors?: Record<string, string>;
}

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const data = axiosError.response?.data;
    if (data) {
      return {
        message: data.message || axiosError.message,
        errorCode: data.errorCode,
        traceId: data.traceId,
        suggestion: data.suggestion,
        validationErrors: data.validationErrors,
      };
    }
    return { message: axiosError.message };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'Une erreur inattendue est survenue' };
}

export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (retries <= 0) throw error;

    const axiosError = error as AxiosError;
    // Don't retry on client errors (4xx except 429)
    if (axiosError.response && axiosError.response.status < 500 && axiosError.response.status !== 429) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryRequest(requestFn, retries - 1, delay * 2);
  }
}

export function logError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    const parsed = parseApiError(error);
    console.error(`[${context}] API Error:`, {
      message: parsed.message,
      code: parsed.errorCode,
      traceId: parsed.traceId,
      suggestion: parsed.suggestion,
    });
  }
}
