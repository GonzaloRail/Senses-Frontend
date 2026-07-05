export interface IncomeReceipt {
  id: string;
  series: string;
  number: number;
  date: string;
  client: string;
  clientDni: string;
  patient: string;
  patientDoc: string;
  phone: string;
  attention: string;
  service: string;
  psychologist: string;
  payment: string;
  subtotal: number;
  igv: number;
  total: number;
  status: "Vigente" | "Anulado" | "Corregido";
  createdBy: string;
  createdAt: string;
}

export interface CreateIncomeAllocation {
  appointmentId: string;
  amount: number;
}

export interface CreateIncomePayload {
  patientId: string;
  totalAmount: number;
  payment: string;
  paidAt: string;
  clientName: string;
  clientDocument: string;
  clientPhone: string;
  allocations: CreateIncomeAllocation[];
  attentionType?: string;
  serviceDescription?: string;
  psychologistName?: string;
}

export interface CreateChangeRequestPayload {
  type: "CANCELLATION" | "CORRECTION" | "REFUND";
  reason: string;
  allocationId?: string;
  requestedAmount?: number;
}

export interface ReviewChangeRequestPayload {
  status: "APPROVED" | "REJECTED";
  reviewComment?: string;
  replacement?: {
    totalAmount: number;
    paymentMethod: string;
    allocations: CreateIncomeAllocation[];
  };
}

export interface ChangeRequest {
  id: string;
  type: "CANCELLATION" | "CORRECTION" | "REFUND";
  reason: string;
  requestedAmount: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  incomeId: string;
  allocationId: string | null;
  receiptCode: string;
  requestedBy: { firstName: string; lastName: string } | null;
  reviewedBy: { firstName: string; lastName: string } | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewComment: string | null;
  replacementIncomeId: string | null;
}

export interface AccountingService {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultPrice: number | null;
  isActive: boolean;
}

export interface PsychologistOption {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ConfigureBillingPayload {
  serviceId: string;
  agreedAmount: number;
}

export type IncomeReceiptFilters = {
  dateFrom: string;
  dateTo: string;
  patient: string;
  client: string;
  psychologist: string;
  payment: string;
  number: string;
};
