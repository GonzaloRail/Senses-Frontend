import type { MockReceipt, MockExpense, CashFlowData } from "@/shared/interfaces/models/Financial";
import api from "@/api/api";
import { ingresosApi } from "@/features/ingresos/api/ingresosApi";
import { accountingExpensesApi } from "@/features/accounting/api/accountingExpensesApi";
import { calculateCommissionsFromReceipts } from "@/features/financial-dashboard/utils/commissions";

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  patient?: string;
  psychologist?: string;
  paymentMethod?: string;
}

type ReportType = "income" | "expenses" | "receipts" | "commissions" | "cash-flow";

function incomeToMock(item: import("@/shared/interfaces/models/IncomeReceipt").IncomeReceipt): MockReceipt {
  return {
    id: item.id as any, date: item.date, client: item.client, patient: item.patient,
    service: item.service, psychologist: item.psychologist,
    payment: item.payment, total: item.total, status: item.status,
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

export async function fetchReport(type: ReportType, filters: ReportFilters) {
  switch (type) {
    case "income":
    case "receipts": {
      const list = await ingresosApi.getFiltered({
        dateFrom: filters.dateFrom, dateTo: filters.dateTo,
        patient: "", client: "", psychologist: filters.psychologist ?? "",
        payment: filters.paymentMethod ?? "", number: "",
      });
      let items = list.map(incomeToMock);
      if (filters.patient) {
        const q = filters.patient.toLowerCase();
        items = items.filter((r) => r.patient.toLowerCase().includes(q));
      }
      return items;
    }
    case "expenses": {
      const result = await accountingExpensesApi.getAll({
        page: 1, take: 500,
        startDate: filters.dateFrom, endDate: filters.dateTo,
      });
      return (result?.data ?? []).map(expenseToMock);
    }
    case "commissions": {
      const list = await ingresosApi.getFiltered({
        dateFrom: filters.dateFrom, dateTo: filters.dateTo,
        patient: "", client: "", psychologist: filters.psychologist ?? "",
        payment: filters.paymentMethod ?? "", number: "",
      });
      const receipts = list.filter((r) => r.status !== "Anulado").map(incomeToMock);
      return calculateCommissionsFromReceipts(receipts);
    }
    case "cash-flow": {
      const [incomeList, expenseResult, openingBalance] = await Promise.all([
        ingresosApi.getFiltered({
          dateFrom: filters.dateFrom, dateTo: filters.dateTo,
          patient: "", client: "", psychologist: "",
          payment: filters.paymentMethod ?? "", number: "",
        }),
        accountingExpensesApi.getAll({
          take: 200,
          startDate: new Date(filters.dateFrom).toISOString(),
          endDate: new Date(filters.dateTo + "T23:59:59").toISOString(),
        }).catch(() => ({ data: [] as any[] })),
        fetchOpeningBalance(filters.dateFrom),
      ]);

      const incomes = incomeList.filter((r) => r.status !== "Anulado").map(incomeToMock);
      const exps = (expenseResult?.data ?? [])
        .filter((e: any) => e.status === "APPROVED")
        .map(expenseToMock);

      const daysSet = new Set([...incomes.map((r) => r.date), ...exps.map((e) => e.date)]);
      const sorted = Array.from(daysSet).sort();
      let saldo = openingBalance;
      const rows = sorted.map((day) => {
        const incomeDay = incomes.filter((r) => r.date === day).reduce((s, r) => s + r.total, 0);
        const fixed = exps.filter((e) => e.date === day && e.type === "Fijo").reduce((s, e) => s + e.amount, 0);
        const variable = exps.filter((e) => e.date === day && e.type === "Variable").reduce((s, e) => s + e.amount, 0);
        const activo = exps.filter((e) => e.date === day && e.type === "Activo").reduce((s, e) => s + e.amount, 0);
        const totalExp = Math.round((fixed + variable + activo) * 100) / 100;
        const final = Math.round((saldo + incomeDay - totalExp) * 100) / 100;
        const row = { day, openingBalance: saldo, income: incomeDay, fixedExpenses: fixed, variableExpenses: variable, assetExpenses: activo, totalExpenses: totalExp, closingBalance: final };
        saldo = final;
        return row;
      });
      return {
        opening: openingBalance,
        rows,
        final: saldo,
        totalIncome: incomes.reduce((s, r) => s + r.total, 0),
        totalExpenses: exps.reduce((s, e) => s + e.amount, 0),
      } as CashFlowData;
    }
    default:
      return [];
  }
}
