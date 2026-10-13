import api from "@/api/api";
import { dayAfterLimaIso, limaDate, startOfLimaDayIso } from "@/shared/utils/limaDates";
import { getBackendEffectiveIncomeAmount } from "../utils/incomeCalculations";
import type {
  IncomeReceipt,
  IncomeReceiptFilters,
  CreateIncomePayload,
  CreateChangeRequestPayload,
  ReviewChangeRequestPayload,
  ChangeRequest,
  AccountingService,
  ConfigureBillingPayload,
} from "@/shared/interfaces/models/IncomeReceipt";
import {
  STATUS_TO_SPANISH,
  BACKEND_TO_PAYMENT_METHOD,
  PAYMENT_METHOD_TO_BACKEND,
} from "../utils/ingresosUtils";

export type PatientBillingContext = {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    phoneNumber: string;
    parentFullName: string | null;
    parentDni: string | null;
    parentPhoneNumber: string | null;
    clinicalHistoryNumber: number;
  };
  appointments: Array<{
    id: string;
    startDate: string;
    psychologistName: string;
    paymentStatus: string | null;
    status: string;
    type: string;
    serviceId: string | null;
    serviceName: string | null;
    agreedAmount: number | null;
  }>;
};

const ATTENTION_MAP: Record<string, string> = {
  PARTICULAR: "Particular",
  SOCIAL: "Social",
  AGREEMENT: "Convenio",
};

function mapBackendIncome(item: any): IncomeReceipt {
  const firstAllocation = item.allocations?.[0];
  return {
    id: item.id,
    series: item.series,
    number: item.receiptNumber,
    date: item.paidAt ? limaDate(item.paidAt) : "",
    client: item.clientName ?? "",
    clientDni: item.clientDocument ?? "",
    patient: item.patientNameSnapshot ?? "",
    patientDoc: item.patientDocumentSnapshot ?? "",
    phone: item.clientPhone ?? "",
    attention: firstAllocation ? (ATTENTION_MAP[firstAllocation.appointmentTypeSnapshot] ?? "Particular") : "Particular",
    service: firstAllocation?.serviceNameSnapshot ?? "",
    psychologist: firstAllocation?.psychologistNameSnapshot ?? "",
    payment: BACKEND_TO_PAYMENT_METHOD[item.paymentMethod] ?? item.paymentMethod,
    subtotal: Number(item.subtotal),
    igv: Number(item.taxAmount),
    total: Number(item.totalAmount),
    effectiveAmount: getBackendEffectiveIncomeAmount(item),
    status: (STATUS_TO_SPANISH[item.status] ?? "Vigente") as IncomeReceipt["status"],
    createdBy: item.createdBy ? `${item.createdBy.firstName ?? ""} ${item.createdBy.lastName ?? ""}`.trim() : "",
    createdAt: item.createdAt ?? "",
  };
}

function mapDailyRegisterEntry(item: any): IncomeReceipt {
  const receiptCode = item.receiptCode ?? "";
  const separator = receiptCode.lastIndexOf("-");
  const series = separator < 0 ? receiptCode : receiptCode.slice(0, separator);
  const numStr = separator < 0 ? "0" : receiptCode.slice(separator + 1);
  const firstPsych = item.psychologists?.[0];
  return {
    id: item.id,
    series,
    number: parseInt(numStr, 10) || 0,
    date: item.paidAt ? limaDate(item.paidAt) : "",
    client: item.clientName ?? "",
    clientDni: item.clientDocument ?? "",
    patient: item.patientName ?? "",
    patientDoc: item.patientDocument ?? "",
    phone: item.clientPhone ?? "",
    attention: "Particular",
    service: "",
    psychologist: firstPsych?.name ?? "",
    payment: BACKEND_TO_PAYMENT_METHOD[item.paymentMethod] ?? item.paymentMethod,
    subtotal: Number(item.subtotal),
    igv: Number(item.taxAmount),
    total: Number(item.grossAmount),
    effectiveAmount: getBackendEffectiveIncomeAmount({ ...item, totalAmount: item.grossAmount, effectiveAmount: item.netPaidAmount }),
    status: (STATUS_TO_SPANISH[item.status] ?? "Vigente") as IncomeReceipt["status"],
    createdBy: "",
    createdAt: item.paidAt ?? "",
  };
}

function mapBackendChangeRequest(item: any): ChangeRequest {
  return {
    id: item.id,
    type: item.type,
    reason: item.reason,
    requestedAmount: item.requestedAmount ? Number(item.requestedAmount) : null,
    status: item.status,
    incomeId: item.incomeId,
    allocationId: item.allocationId,
    receiptCode: item.receiptCode ?? `${item.income?.series ?? ""}-${String(item.income?.receiptNumber ?? "").padStart(6, "0")}`,
    requestedBy: item.requestedBy ? { firstName: item.requestedBy.firstName, lastName: item.requestedBy.lastName } : null,
    reviewedBy: item.reviewedBy ? { firstName: item.reviewedBy.firstName, lastName: item.reviewedBy.lastName } : null,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt ?? null,
    reviewComment: item.reviewComment ?? null,
    replacementIncomeId: item.replacementIncomeId ?? null,
  };
}

async function fetchIncomePages(params: Record<string, string | number> = {}): Promise<IncomeReceipt[]> {
  const requestPage = async (page: number) => {
    const { data } = await api.get("/api/v1/accounting/incomes", { params: { ...params, page, take: 100 } });
    return data;
  };
  const firstPage = await requestPage(1);
  const remainingPages = await Promise.all(Array.from(
    { length: Math.max(Number(firstPage.totalPages ?? 1) - 1, 0) },
    (_, index) => requestPage(index + 2),
  ));
  return [firstPage, ...remainingPages].flatMap((page) => page.items ?? []).map(mapBackendIncome);
}

export const ingresosApi = {
  async getPatientBillingContext(patientId: string): Promise<PatientBillingContext> {
    const response = await api.get(
      `/api/v1/accounting/patients/${patientId}/billing-context`
    );
    return response.data;
  },

  async getAll(): Promise<IncomeReceipt[]> {
    return fetchIncomePages();
  },

  async getById(id: string): Promise<IncomeReceipt | undefined> {
    const response = await api.get(`/api/v1/accounting/incomes/${id}`);
    return mapBackendIncome(response.data);
  },

  async getIncomeRaw(id: string) {
    const { data } = await api.get(`/api/v1/accounting/incomes/${id}`);
    return data;
  },

  async getFiltered(filters: IncomeReceiptFilters): Promise<IncomeReceipt[]> {
    const params: Record<string, string | number> = { page: 1, take: 100 };

    if (filters.dateFrom) params.from = startOfLimaDayIso(filters.dateFrom);
    if (filters.dateTo) params.to = dayAfterLimaIso(filters.dateTo);

    const searchTerms: string[] = [];
    if (filters.patient) searchTerms.push(filters.patient);
    if (filters.client) searchTerms.push(filters.client);
    if (searchTerms.length > 0) params.search = searchTerms.join(" ");

    if (filters.payment) {
      const backendKey = PAYMENT_METHOD_TO_BACKEND[filters.payment] ?? filters.payment;
      params.paymentMethod = backendKey;
    }

    if (filters.psychologist) {
      params.psychologistId = filters.psychologist;
    }

    if (filters.number) params.receiptNumber = parseInt(filters.number, 10);

    return fetchIncomePages(params);
  },

  async create(input: CreateIncomePayload): Promise<IncomeReceipt> {
    const paymentMethod = PAYMENT_METHOD_TO_BACKEND[input.payment] ?? input.payment?.toUpperCase() ?? "YAPE";

    const response = await api.post("/api/v1/accounting/incomes", {
      patientId: input.patientId,
      totalAmount: input.totalAmount,
      paymentMethod,
      paidAt: input.paidAt,
      clientName: input.clientName,
      clientDocument: input.clientDocument,
      clientPhone: input.clientPhone,
      allocations: input.allocations,
    });
    return mapBackendIncome(response.data);
  },

  async createChangeRequest(incomeId: string, payload: CreateChangeRequestPayload): Promise<void> {
    await api.post(`/api/v1/accounting/incomes/${incomeId}/change-requests`, payload);
  },

  async getChangeRequests(params?: {
    page?: number;
    take?: number;
    status?: string;
    type?: string;
  }): Promise<{ items: ChangeRequest[]; total: number; totalPages: number }> {
    const response = await api.get("/api/v1/accounting/income-change-requests", {
      params: { page: 1, take: 50, ...params },
    });
    return {
      items: (response.data.items ?? []).map(mapBackendChangeRequest),
      total: response.data.total ?? 0,
      totalPages: response.data.totalPages ?? 0,
    };
  },

  async reviewChangeRequest(requestId: string, payload: ReviewChangeRequestPayload): Promise<void> {
    await api.put(`/api/v1/accounting/income-change-requests/${requestId}/review`, payload);
  },

  async getServices(): Promise<AccountingService[]> {
    const response = await api.get("/api/v1/accounting/services");
    return response.data ?? [];
  },

  async configureAppointmentBilling(appointmentId: string, payload: ConfigureBillingPayload): Promise<void> {
    await api.put(`/api/v1/accounting/appointments/${appointmentId}/billing`, payload);
  },

  async getAppointmentPaymentSummary(appointmentId: string): Promise<any> {
    const response = await api.get(`/api/v1/accounting/appointments/${appointmentId}/payment-summary`);
    return response.data;
  },

  downloadReceiptPdfUrl(id: string): string {
    return `/api/v1/accounting/incomes/${id}/receipt.pdf`;
  },

  async downloadReceiptPdf(id: string): Promise<void> {
    const response = await api.get(`/api/v1/accounting/incomes/${id}/receipt.pdf`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },

  async getDailyRegister(date?: string): Promise<IncomeReceipt[]> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await api.get("/api/v1/accounting/incomes/daily-register", { params });
    return (response.data.entries ?? []).map(mapDailyRegisterEntry);
  },
};
