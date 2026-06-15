import type { Patient } from "../models";

export interface PatientsPaginatedResponse {
  currentPage: number;
  totalPages: number;
  patients: Patient[];
}
