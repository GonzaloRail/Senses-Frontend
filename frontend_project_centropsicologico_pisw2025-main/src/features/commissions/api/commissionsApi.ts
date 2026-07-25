import api from "@/api/api";

export interface Psychologist {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MonthlyClose {
  id: string;
  month: number;
  year: number;
  status: string;
}

export interface PsychologistCommission {
  id: string;
  grossIncome: number | string;
  commissionRate: number | string;
  commissionAmount: number | string;
  sensesAmount: number | string;
  taxAmount: number | string;
  otherCosts: number | string;
  paymentStatus: "PENDING" | "READY_FOR_PAYMENT" | "PAID";
  psychologistId: string;
  psychologist: Psychologist;
  monthlyCloseId: string;
  monthlyClose: MonthlyClose;
  paidById?: string;
  paidAt?: string;
  createdAt: string;
}

export interface GetCommissionsParams {
  page?: number;
  take?: number;
  status?: string;
  monthlyCloseId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    take: number;
    totalPages: number;
  };
}

export interface CommissionRate {
  id: string;
  percentage: number | string;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  psychologistId: string;
  configuredById: string;
  createdAt: string;
  updatedAt: string;
}

export const getCommissionsApi = async (params: GetCommissionsParams): Promise<PaginatedResponse<PsychologistCommission>> => {
  const { data } = await api.get("/api/v1/accounting/commissions", { params });
  return data;
};

export const getPsychologistCommissionsApi = async (psychologistId: string, status?: string): Promise<PsychologistCommission[]> => {
  const { data } = await api.get(`/api/v1/accounting/commissions/psychologist/${psychologistId}`, { params: { status } });
  return data;
};

export const payCommissionApi = async (id: string): Promise<PsychologistCommission> => {
  const { data } = await api.patch(`/api/v1/accounting/commissions/${id}/pay`);
  return data;
};

export const getCommissionRatesApi = async (psychologistId: string): Promise<CommissionRate[]> => {
  const { data } = await api.get(`/api/v1/accounting/commissions/rates/${psychologistId}`);
  return data;
};

export const setCommissionRateApi = async (payload: { psychologistId: string; percentage: number; validFrom?: string }): Promise<CommissionRate> => {
  const { data } = await api.post(`/api/v1/accounting/commissions/rates`, payload);
  return data;
};
