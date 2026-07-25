import api from "@/api/api";

export interface UserSnippet {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AccountingAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason?: string;
  previousData?: any;
  newData?: any;
  performedById: string;
  performedBy: UserSnippet;
  createdAt: string;
}

export interface GetAuditLogsParams {
  page?: number;
  take?: number;
  action?: string;
  from?: string;
  to?: string;
}

export interface PaginatedAuditResponse {
  data: AccountingAuditLog[];
  meta: {
    total: number;
    page: number;
    take: number;
    totalPages: number;
  };
}

export const getAccountingAuditLogsApi = async (
  params: GetAuditLogsParams
): Promise<PaginatedAuditResponse> => {
  const { data } = await api.get("/api/v1/accounting-audit", { params });
  return data;
};

export const getAccountingAuditLogByIdApi = async (
  id: string
): Promise<AccountingAuditLog> => {
  const { data } = await api.get(`/api/v1/accounting-audit/${id}`);
  return data;
};
