import type { AppointmentStatus } from "../models";

interface AppointmentsListItem {
  id: string;
  patientName: string;
  psychologistName: string;
  startDate: string;
  status: AppointmentStatus;
}

export interface AppointmentsListByDatePaginatedResponse {
  currentPage: number;
  totalPages: number;
  appointments: AppointmentsListItem[];
}