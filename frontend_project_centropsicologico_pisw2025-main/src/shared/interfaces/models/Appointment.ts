import type { Office } from "./Office";
import type { Patient } from "./Patient";
import type { User } from "./User";

export type AppointmentStatus = "PENDING" | "CANCELED" | "DONE" | "IN_PROGRESS";

export type AppointmentType = "PARTICULAR" | "SOCIAL";

export interface Appointment {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;

  status: AppointmentStatus;

  officeId: string;
  office: Office;

  userId: string;
  user: User;

  patientId: string;
  patient: Patient;

  type: AppointmentType;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentPayload {
  patientId: string;
  psychologistId: string;
  officeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  type?: AppointmentType | string;
}

// check if is necessary add more fields
export type UpdateAppointmentPayload = CreateAppointmentPayload;
