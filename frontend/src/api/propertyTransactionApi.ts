import api from './axiosConfig';

const unwrap = <T>(res: { data?: T | { data?: T } }): T | undefined => {
  const payload = res.data;
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
};

export interface PropertyTransactionInitiateResponse {
  [key: string]: string | number;
  orderId: string;
  amount: number;
  transactionType: 'RESERVATION' | 'PURCHASE';
  sagaId: string | number;
}

export const propertyTransactionApi = {
  reserve: (propertyId: number, lang = 'fr') =>
    api
      .post<PropertyTransactionInitiateResponse>(`/v2/properties/${propertyId}/reserve?lang=${lang}`)
      .then((res) => unwrap(res) || res.data),

  buy: (propertyId: number, lang = 'fr') =>
    api
      .post<PropertyTransactionInitiateResponse>(`/v2/properties/${propertyId}/buy?lang=${lang}`)
      .then((res) => unwrap(res) || res.data),
};
