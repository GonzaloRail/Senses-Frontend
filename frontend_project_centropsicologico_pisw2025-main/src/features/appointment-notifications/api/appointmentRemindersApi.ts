import api from "@/api/api";

export type AppointmentReminderChannel = "SMS" | "WHATSAPP";
export type AppointmentReminderStatus =
  | "PENDING"
  | "CLAIMED"
  | "SENDING"
  | "ACCEPTED"
  | "DELIVERED"
  | "UNDELIVERABLE"
  | "SIMULATED"
  | "CANCELED"
  | "SKIPPED"
  | "FAILED"
  | "UNKNOWN";

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  version: number;
  channel: AppointmentReminderChannel;
  status: AppointmentReminderStatus;
  leadMinutes: 60 | 1440;
  scheduledAt: string;
  appointmentStartAt: string;
  attempts: number;
  nextAttemptAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  appointment: {
    patientId: string;
    userId: string;
    officeId: string;
    startDate: string;
    endDate: string;
    status: string;
    reminderVersion: number;
    confirmedAt: string | null;
    confirmedVersion: number | null;
    declinedAt: string | null;
    declinedVersion: number | null;
  };
}

export interface AppointmentRemindersResponse {
  data: AppointmentReminder[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
}

export const getAppointmentRemindersApi = async (params: { page?: number; take?: number } = {}) => {
  const response = await api.get<AppointmentRemindersResponse>("/api/v1/appointments/reminders", {
    params: { page: 1, take: 100, ...params },
  });
  return response.data;
};
