import api from "@/api/api";

export interface AccountingExpense {
  id: string;
  type: string;
  concept: string;
  amount: number;
  purpose: string;
  
  supplierName?: string;
  supplierDocument?: string;
  receiptType: string;
  receiptNumber?: string;
  paymentMethod: string;
  evidenceUrl?: string;
  observations?: string;

  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  
  responsibleId?: string;
  monthlyCloseId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface GetAccountingExpensesParams {
  page?: number;
  take?: number;
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateAccountingExpenseData {
  type: string;
  concept: string;
  amount: number;
  purpose: string;
  
  supplierName?: string;
  supplierDocument?: string;
  receiptType: string;
  receiptNumber?: string;
  paymentMethod: string;
  evidenceUrl?: string;
  observations?: string;

  responsibleId?: string;
  monthlyCloseId?: string;
}

export interface UpdateAccountingExpenseStatusData {
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewComment?: string;
}

export const accountingExpensesApi = {
  getAll: async (params?: GetAccountingExpensesParams) => {
    const response = await api.get<{
      data: AccountingExpense[];
      meta: { total: number; page: number; lastPage: number };
    }>("/api/v1/accounting-expenses", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<AccountingExpense>(`/api/v1/accounting-expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateAccountingExpenseData) => {
    const response = await api.post<AccountingExpense>("/api/v1/accounting-expenses", data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateAccountingExpenseStatusData) => {
    const response = await api.patch<AccountingExpense>(`/api/v1/accounting-expenses/${id}/status`, data);
    return response.data;
  },
};
