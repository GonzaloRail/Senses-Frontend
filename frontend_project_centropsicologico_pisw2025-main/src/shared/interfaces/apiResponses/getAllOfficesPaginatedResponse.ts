import type { Office } from "../models";

export interface OfficesPaginatedResponse {
  currentPage: number,
  totalPages: number,
  offices: Office[],
}