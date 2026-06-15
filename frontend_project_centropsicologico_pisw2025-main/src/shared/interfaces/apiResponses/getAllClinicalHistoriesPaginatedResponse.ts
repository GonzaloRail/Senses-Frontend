import type { ClinicalHistory } from "../models";

export interface ClinicalHistoriesPaginatedResponse {
  currentPage: number;
  totalPages: number;

  clinicalHistories: ClinicalHistory[];
}
