import api from "@/api/api";
import { dayAfterLimaIso, startOfLimaDayIso } from "@/shared/utils/limaDates";
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
  commissionAmount: string | null;
  clinicNetAmount: string | null;
  calculationStatus?: "CALCULATED" | "MISSING_COMMISSION_RATE";
  knownCommissionAmount?: string;
  knownClinicNetAmount?: string;
  unresolvedGrossIncome?: string;
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
  warnings?: Array<{
    psychologistId: string;
    code: "MISSING_COMMISSION_RATE";
    message: string;
    appointmentId: string;
    allocationId: string;
    receiptLabel: string;
    paidAt: string;
  }>;
  summary: {
    grossIncome: string;
    commissionAmount: string | null;
    clinicNetAmount: string | null;
    calculationStatus?: "CALCULATED" | "MISSING_COMMISSION_RATE";
    knownCommissionAmount?: string;
    knownClinicNetAmount?: string;
    unresolvedGrossIncome?: string;
    paidAppointmentsCount: number;
  };
  meta: PaginatedResponse<never>["meta"];
}

export interface GetCommissionReportParams {
  dateFrom: string;
  dateTo: string;
  psychologistId?: string;
}

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
  const commission = row.commissionAmount === null ? null : Number(row.commissionAmount);

  return {
    psychologistId: row.psychologist.id,
    psychologist: `${row.psychologist.firstName} ${row.psychologist.lastName}`.trim(),
    commissionRate:
      commission === null ? null : grossIncome > 0 ? (commission / grossIncome) * 100 : 0,
    grossIncome,
    commission,
    clinicNet: row.clinicNetAmount === null ? null : Number(row.clinicNetAmount),
    calculationStatus: row.calculationStatus ?? (commission === null ? "MISSING_COMMISSION_RATE" : "CALCULATED"),
    knownCommissionAmount: Number(row.knownCommissionAmount ?? row.commissionAmount ?? 0),
    knownClinicNetAmount: Number(row.knownClinicNetAmount ?? row.clinicNetAmount ?? 0),
    unresolvedGrossIncome: Number(row.unresolvedGrossIncome ?? 0),
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
  commissionAmount: summary.commissionAmount === null ? null : Number(summary.commissionAmount),
  clinicNetAmount: summary.clinicNetAmount === null ? null : Number(summary.clinicNetAmount),
  calculationStatus: summary.calculationStatus ?? (summary.commissionAmount === null ? "MISSING_COMMISSION_RATE" : "CALCULATED"),
  knownCommissionAmount: Number(summary.knownCommissionAmount ?? summary.commissionAmount ?? 0),
  knownClinicNetAmount: Number(summary.knownClinicNetAmount ?? summary.clinicNetAmount ?? 0),
  unresolvedGrossIncome: Number(summary.unresolvedGrossIncome ?? 0),
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

  const reportRows = allRows.filter(hasCommissionReport);
  const names = new Map(reportRows.map((row) => [row.psychologist.id, row.psychologist]));
  // Global warnings repeat on each page; consume the first page only.
  const warnings = firstPage.warnings?.map((warning) => ({
    ...warning,
    firstName: names.get(warning.psychologistId)?.firstName ?? "",
    lastName: names.get(warning.psychologistId)?.lastName ?? "",
  })) ?? allRows.filter(isMissingRate).map((warning) => ({
      psychologistId: warning.psychologistId,
      firstName: warning.firstName,
      lastName: warning.lastName,
      code: warning.code,
      message: warning.message,
    }));
  return {
    rows: reportRows.map(normalizeReportRow),
    warnings,
    summary: normalizeSummary(firstPage.summary),
  };
};

export const getCommissionsApi = async (params: GetCommissionsParams): Promise<PaginatedResponse<PsychologistCommission>> => {
  const { data } = await api.get("/api/v1/accounting/commissions", { params });
  return data;
};

type CalculationStatus = "CALCULATED" | "MISSING_COMMISSION_RATE";

interface CommissionDetailAmounts {
  collectedAmount: string;
  refundedAmount: string;
  grossIncome: string;
  commissionAmount: string | null;
  clinicNetAmount: string | null;
  calculationStatus: CalculationStatus;
}

export interface CommissionPaymentDetail extends CommissionDetailAmounts {
  allocationId: string;
  incomeId: string;
  receiptLabel: string;
  paidAt: string;
  rateId: string | null;
  percentage: string | null;
  rateValidFrom: string | null;
  rateValidTo: string | null;
}

export interface AppointmentCommissionDetail extends CommissionDetailAmounts {
  appointmentId: string;
  appointmentDate: string;
  serviceName: string | null;
  payments: CommissionPaymentDetail[];
}

export interface CommissionDetailsResponse {
  psychologist: Psychologist;
  period: { from: string; to: string; timeZone: string; currency: string };
  data: AppointmentCommissionDetail[];
  summary: CommissionDetailAmounts & { paidAppointmentsCount: number };
  warnings: Array<{
    code: string;
    appointmentId: string;
    allocationId: string;
    paidAt: string;
    message: string;
  }>;
  meta: PaginatedResponse<never>["meta"];
}

export const getCommissionDetailsApi = async (
  params: GetCommissionReportParams & { psychologistId: string; page: number },
  signal?: AbortSignal
): Promise<CommissionDetailsResponse> => {
  const { data } = await api.get<CommissionDetailsResponse>(
    "/api/v1/accounting/commissions/report/details",
    {
      params: {
        psychologistId: params.psychologistId,
        from: startOfLimaDayIso(params.dateFrom),
        to: dayAfterLimaIso(params.dateTo),
        page: params.page,
        take: 10,
      },
      signal,
    }
  );
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
