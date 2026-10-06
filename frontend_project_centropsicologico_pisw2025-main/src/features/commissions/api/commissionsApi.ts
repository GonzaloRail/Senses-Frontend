import api from "@/api/api";
import type {
  CommissionByPsychologist,
  CommissionReportData,
  CommissionReportSummary,
} from "@/shared/interfaces/models/Financial";

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

interface CommissionReportApiRow {
  psychologist: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  paidAppointmentsCount: number;
  grossIncome: string;
  commissionAmount: string;
  clinicNetAmount: string;
  rateBreakdown: Array<{
    percentage: string;
    validFrom: string;
    validTo: string | null;
    grossIncome: string;
    commissionAmount: string;
  }>;
}

interface MissingCommissionRateApiRow {
  psychologistId: string;
  firstName: string;
  lastName: string;
  code: "MISSING_COMMISSION_RATE";
  message: string;
}

interface CommissionReportApiResponse {
  data: Array<CommissionReportApiRow | MissingCommissionRateApiRow>;
  summary: {
    grossIncome: string;
    commissionAmount: string;
    clinicNetAmount: string;
    paidAppointmentsCount: number;
  };
  meta: PaginatedResponse<never>["meta"];
}

export interface GetCommissionReportParams {
  dateFrom: string;
  dateTo: string;
  psychologistId?: string;
}

const startOfLimaDayIso = (date: string) =>
  new Date(`${date}T00:00:00-05:00`).toISOString();

const dayAfterLimaIso = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + 1);
  const nextDate = utcDate.toISOString().slice(0, 10);
  return startOfLimaDayIso(nextDate);
};

const isMissingRate = (
  row: CommissionReportApiRow | MissingCommissionRateApiRow
): row is MissingCommissionRateApiRow => "code" in row;

const hasCommissionReport = (
  row: CommissionReportApiRow | MissingCommissionRateApiRow
): row is CommissionReportApiRow => !isMissingRate(row);

const normalizeReportRow = (
  row: CommissionReportApiRow
): CommissionByPsychologist => {
  const grossIncome = Number(row.grossIncome);
  const commission = Number(row.commissionAmount);

  return {
    psychologistId: row.psychologist.id,
    psychologist: `${row.psychologist.firstName} ${row.psychologist.lastName}`.trim(),
    commissionRate:
      grossIncome > 0 ? (commission / grossIncome) * 100 : 0,
    grossIncome,
    commission,
    clinicNet: Number(row.clinicNetAmount),
    receiptsCount: row.paidAppointmentsCount,
    rateBreakdown: row.rateBreakdown.map((rate) => ({
      percentage: Number(rate.percentage),
      validFrom: rate.validFrom,
      validTo: rate.validTo,
      grossIncome: Number(rate.grossIncome),
      commissionAmount: Number(rate.commissionAmount),
    })),
  };
};

const normalizeSummary = (
  summary: CommissionReportApiResponse["summary"]
): CommissionReportSummary => ({
  grossIncome: Number(summary.grossIncome),
  commissionAmount: Number(summary.commissionAmount),
  clinicNetAmount: Number(summary.clinicNetAmount),
  paidAppointmentsCount: summary.paidAppointmentsCount,
});

export const getCommissionReportApi = async ({
  dateFrom,
  dateTo,
  psychologistId,
}: GetCommissionReportParams): Promise<CommissionReportData> => {
  const requestPage = async (page: number) => {
    const { data } = await api.get<CommissionReportApiResponse>(
      "/api/v1/accounting/commissions/report",
      {
        params: {
          from: startOfLimaDayIso(dateFrom),
          to: dayAfterLimaIso(dateTo),
          psychologistId: psychologistId || undefined,
          page,
          take: 100,
        },
      }
    );
    return data;
  };

  const firstPage = await requestPage(1);
  const remainingPages = await Promise.all(
    Array.from(
      { length: Math.max(firstPage.meta.totalPages - 1, 0) },
      (_, index) => requestPage(index + 2)
    )
  );
  const allRows = [
    ...firstPage.data,
    ...remainingPages.flatMap((page) => page.data),
  ];

  return {
    rows: allRows.filter(hasCommissionReport).map(normalizeReportRow),
    warnings: allRows.filter(isMissingRate).map((warning) => ({
      psychologistId: warning.psychologistId,
      firstName: warning.firstName,
      lastName: warning.lastName,
      code: warning.code,
      message: warning.message,
    })),
    summary: normalizeSummary(firstPage.summary),
  };
};

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
