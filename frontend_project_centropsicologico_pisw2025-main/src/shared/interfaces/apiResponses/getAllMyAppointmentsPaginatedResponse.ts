import type { AppointmentStatus } from "../models";

interface MyAppointmentsListItem {
  id: string;
  patientName: string;
  startDate: string;
  status: AppointmentStatus;
}

export interface MyAppointmentsListPaginatedResponse {
  currentPage: number;
  totalPages: number;
  appointments: MyAppointmentsListItem[];
}