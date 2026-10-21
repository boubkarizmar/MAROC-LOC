import api from './axiosConfig';

export interface CMIPaymentInitiateRequest {
  orderId: string;
  amount: number;
  currency?: string;
  lang?: string;
  email: string;
  advertisementId?: number;
  propertyId?: number;
  transactionType?: 'RESERVATION' | 'PURCHASE';
}

export interface CMIPaymentInitiateResponse {
  [key: string]: string;
}

export interface CMIPaymentStatusResponse {
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export const CMI_GATEWAY_URL = import.meta.env.VITE_CMI_GATEWAY_URL || 'https://payment.cmi.co.ma/fim/est3Dgate';

// Helper: the backend wraps payloads in ApiResponse { status, data, ... }.
// We transparently unwrap the inner data when present.
const unwrap = <T>(res: { data?: T | { data?: T } }): T | undefined => {
  const payload = res.data;
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
};

export const cmiPaymentApi = {
  initiate: (data: CMIPaymentInitiateRequest) =>
    api
      .post<CMIPaymentInitiateResponse>('/v1/payments/cmi/initiate', data)
      .then((res) => unwrap(res) || res.data),

  getStatus: (orderId: string) =>
    api
      .get<CMIPaymentStatusResponse>(`/v1/payments/status?orderId=${orderId}`)
      .then((res) => unwrap(res) || res.data),
};

/**
 * Build a hidden form and auto-submit to CMI gateway.
 * This is required because CMI expects a POST form submission, not a fetch/XHR call.
 */
export function submitCMIPaymentForm(params: Record<string, string>, gatewayUrl: string): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;
  form.style.display = 'none';

  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  // Form will navigate away — no need to remove it
}
