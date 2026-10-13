export type DateMode = "day" | "week" | "month" | "custom";
export type PaymentMethod = "Yape" | "Plin" | "Efectivo" | "Transferencia" | "Tarjeta";
export type ExpenseType = "Fijo" | "Variable" | "Activo";
export type ReportType = "income" | "expenses" | "receipts" | "commissions" | "cash-flow";

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  openingBalance: number;
  availableBalance: number;
  totalCommissions: number | null;
  incomeCount: number;
  expensesCount: number;
}

export interface IncomeByPayment {
  paymentMethod: string;
  total: number;
  count: number;
}

export interface ExpenseByType {
  type: string;
  total: number;
  count: number;
}

export interface CashFlowEntry {
  day: string;
  openingBalance: number;
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  assetExpenses: number;
  totalExpenses: number;
  closingBalance: number;
}

export interface CashFlowData {
  opening: number;
  rows: CashFlowEntry[];
  final: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface CommissionByPsychologist {
  psychologistId: string;
  psychologist: string;
  commissionRate: number | null;
  grossIncome: number;
  commission: number | null;
  clinicNet: number | null;
  calculationStatus: "CALCULATED" | "MISSING_COMMISSION_RATE";
  knownCommissionAmount: number;
  knownClinicNetAmount: number;
  unresolvedGrossIncome: number;
  receiptsCount: number;
  rateBreakdown: CommissionRateBreakdown[];
}

export interface CommissionRateBreakdown {
  percentage: number;
  validFrom: string;
  validTo: string | null;
  grossIncome: number;
  commissionAmount: number;
}

export interface MissingCommissionRate {
  psychologistId: string;
  firstName: string;
  lastName: string;
  code: "MISSING_COMMISSION_RATE";
  message: string;
  appointmentId?: string;
  allocationId?: string;
  receiptLabel?: string;
  paidAt?: string;
}

export interface CommissionReportSummary {
  grossIncome: number;
  commissionAmount: number | null;
  clinicNetAmount: number | null;
  calculationStatus: "CALCULATED" | "MISSING_COMMISSION_RATE";
  knownCommissionAmount: number;
  knownClinicNetAmount: number;
  unresolvedGrossIncome: number;
  paidAppointmentsCount: number;
}

export interface CommissionReportData {
  rows: CommissionByPsychologist[];
  warnings: MissingCommissionRate[];
  summary: CommissionReportSummary;
}

export interface MockReceipt {
  id: string | number;
  date: string;
  client: string;
  patient: string;
  service: string;
  psychologist: string;
  payment: string;
  total: number;
  effectiveAmount?: number;
  status: "Vigente" | "Anulado" | "Corregido";
}

export interface MockExpense {
  id: string | number;
  date: string;
  type: string;
  concept: string;
  provider: string;
  payment: string;
  amount: number;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  area: string;
}

export interface ReportFiltersState {
  dateFrom: string;
  dateTo: string;
  patient: string;
  psychologist: string;
  paymentMethod: string;
  reportType: ReportType;
}
