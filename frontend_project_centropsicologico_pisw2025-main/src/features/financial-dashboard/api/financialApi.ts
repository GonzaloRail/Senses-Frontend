import type {
  FinancialSummary,
  IncomeByPayment,
  ExpenseByType,
  CashFlowData,
  CommissionByPsychologist,
  DateMode,
  MockReceipt,
  MockExpense,
} from "@/shared/interfaces/models/Financial";
import api from "@/api/api";
import { ingresosApi } from "@/features/ingresos/api/ingresosApi";
import { accountingExpensesApi } from "@/features/accounting/api/accountingExpensesApi";
import { calculateCommissionsFromReceipts } from "../utils/commissions";
import { PAYMENT_METHODS, EXPENSE_TYPES } from "../utils/mockData";

export interface DashboardParams {
  dateMode: DateMode;
  selectedDate: Date;
  paymentFilter: string;
  customFrom: string;
  customTo: string;
}

export interface DashboardData {
  summary: FinancialSummary;
  incomeByPayment: IncomeByPayment[];
  expensesByType: ExpenseByType[];
  cashFlow: CashFlowData;
  commissions: CommissionByPsychologist[];
}

function getDateRange(dateMode: DateMode, selectedDate: Date, customFrom?: string, customTo?: string) {
  if (dateMode === "day") {
    const d = selectedDate.toISOString().slice(0, 10);
    return { from: d, to: d };
  }
  if (dateMode === "week") {
    const to = selectedDate.toISOString().slice(0, 10);
    const from = new Date(selectedDate.getTime() - 6 * 86400000).toISOString().slice(0, 10);
    return { from, to };
  }
  if (dateMode === "month") {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const from = `${year}-${month}-01`;
    const lastDay = new Date(year, selectedDate.getMonth() + 1, 0).getDate();
    const to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  }
  return { from: customFrom ?? new Date().toISOString().slice(0, 7) + "-01", to: customTo ?? new Date().toISOString().slice(0, 10) };
}

function incomeToMock(item: import("@/shared/interfaces/models/IncomeReceipt").IncomeReceipt): MockReceipt {
  return {
    id: item.id as any,
    date: item.date,
    client: item.client,
    patient: item.patient,
    service: item.service,
    psychologist: item.psychologist,
    payment: item.payment,
    total: item.total,
    status: item.status,
  };
}

function expenseToMock(item: import("@/features/accounting/api/accountingExpensesApi").AccountingExpense): MockExpense {
  return {
    id: item.id as any,
    date: item.createdAt?.slice(0, 10) ?? "",
    type: item.type ?? "Variable",
    concept: item.concept ?? "",
    provider: item.supplierName ?? "",
    payment: item.paymentMethod === "CASH" ? "Efectivo" :
             item.paymentMethod === "YAPE" ? "Yape" :
             item.paymentMethod === "PLIN" ? "Plin" :
             item.paymentMethod === "BANK_TRANSFER" ? "Transferencia" :
             item.paymentMethod === "CARD" ? "Tarjeta" : item.paymentMethod,
    amount: Number(item.amount),
    status: item.status === "APPROVED" ? "Aprobado" : "Pendiente",
    area: item.purpose ?? "",
  };
}

async function fetchOpeningBalance(toDate: string): Promise<number> {
  try {
    const params: Record<string, string> = {};
    if (toDate) params.to = new Date(toDate).toISOString();
    const response = await api.get("/api/v1/accounting/balance", { params });
    return Number(response.data?.totals?.availableBalance) || 0;
  } catch {
    return 0;
  }
}

export async function fetchDashboardData(params: DashboardParams): Promise<DashboardData> {
  const dr = getDateRange(params.dateMode, params.selectedDate, params.customFrom, params.customTo);

  const [incomeList, expenseResult, openingBalance] = await Promise.all([
    ingresosApi.getFiltered({
      dateFrom: dr.from, dateTo: dr.to,
      patient: "", client: "", psychologist: "",
      payment: params.paymentFilter, number: "",
    }),
    accountingExpensesApi.getAll({
      take: 200,
      startDate: new Date(dr.from).toISOString(),
      endDate: new Date(dr.to + "T23:59:59").toISOString(),
    }).catch(() => ({ data: [] as any[] })),
    fetchOpeningBalance(dr.from),
  ]);

  const exps: MockExpense[] = (expenseResult?.data ?? [])
    .filter((e: any) => e.status === "APPROVED")
    .map(expenseToMock);

  const receipts = incomeList.filter((r) => r.status !== "Anulado").map(incomeToMock);

  const totalIncome = receipts.reduce((s, r) => s + r.total, 0);
  const totalExpenses = exps.reduce((s, e) => s + e.amount, 0);
  const availableBalance = Math.round((openingBalance + totalIncome - totalExpenses) * 100) / 100;

  const commissions = calculateCommissionsFromReceipts(receipts);

  const summary: FinancialSummary = {
    totalIncome,
    totalExpenses,
    openingBalance,
    availableBalance,
    totalCommissions: commissions.reduce((s, c) => s + c.commission, 0),
    incomeCount: receipts.length,
    expensesCount: exps.length,
  };

  const incomeByPayment = PAYMENT_METHODS.map((p) => ({
    paymentMethod: p,
    total: receipts.filter((r) => r.payment === p).reduce((s, r) => s + r.total, 0),
    count: receipts.filter((r) => r.payment === p).length,
  }));

  const expensesByType = EXPENSE_TYPES.map((t) => ({
    type: t,
    total: exps.filter((e) => e.type === t).reduce((s, e) => s + e.amount, 0),
    count: exps.filter((e) => e.type === t).length,
  }));

  const daysSet = new Set([...receipts.map((r) => r.date), ...exps.map((e) => e.date)]);
  const sorted = Array.from(daysSet).sort();
  let saldo = openingBalance;
  const flowRows = sorted.map((day) => {
    const incomeDay = receipts.filter((r) => r.date === day).reduce((s, r) => s + r.total, 0);
    const fixed = exps.filter((e) => e.date === day && e.type === "Fijo").reduce((s, e) => s + e.amount, 0);
    const variable = exps.filter((e) => e.date === day && e.type === "Variable").reduce((s, e) => s + e.amount, 0);
    const activo = exps.filter((e) => e.date === day && e.type === "Activo").reduce((s, e) => s + e.amount, 0);
    const totalExp = Math.round((fixed + variable + activo) * 100) / 100;
    const final = Math.round((saldo + incomeDay - totalExp) * 100) / 100;
    const row = { day, openingBalance: saldo, income: incomeDay, fixedExpenses: fixed, variableExpenses: variable, assetExpenses: activo, totalExpenses: totalExp, closingBalance: final };
    saldo = final;
    return row;
  });

  const cashFlow: CashFlowData = {
    opening: openingBalance,
    rows: flowRows,
    final: saldo,
    totalIncome: receipts.reduce((s, r) => s + r.total, 0),
    totalExpenses: exps.reduce((s, e) => s + e.amount, 0),
  };

  return { summary, incomeByPayment, expensesByType, cashFlow, commissions };
}
