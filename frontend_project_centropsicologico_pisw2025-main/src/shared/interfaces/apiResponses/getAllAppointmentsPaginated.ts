import type { AppointmentStatus } from "../models";
import type { PaginatedResponse } from "./PaginatedResponse";

export interface AppointmentPaginatedResponse extends PaginatedResponse {
  appointments: AppointmentForTable[];
}

interface AppointmentForTable {
  id: string;
  patientName: string;
  startDateTime: Date;
  psychologistName: string;
  status: AppointmentStatus;
  search?: string;
}
