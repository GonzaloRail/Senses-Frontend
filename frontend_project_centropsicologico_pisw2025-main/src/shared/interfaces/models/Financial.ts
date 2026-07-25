export type DateMode = "day" | "week" | "month" | "custom";
export type PaymentMethod = "Yape" | "Plin" | "Efectivo" | "Transferencia" | "Tarjeta";
export type ExpenseType = "Fijo" | "Variable" | "Activo";
export type ReportType = "income" | "expenses" | "receipts" | "commissions" | "cash-flow";

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  openingBalance: number;
  availableBalance: number;
  totalCommissions: number;
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
  psychologist: string;
  commissionRate: number;
  grossIncome: number;
  commission: number;
  sensesFee: number;
  igv: number;
  costs: number;
  receiptsCount: number;
}

export interface PsychologistConfig {
  name: string;
  commission: number;
}

export interface MockReceipt {
  id: number;
  date: string;
  client: string;
  patient: string;
  service: string;
  psychologist: string;
  payment: string;
  total: number;
  status: "Vigente" | "Anulado" | "Corregido";
}

export interface MockExpense {
  id: number;
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
