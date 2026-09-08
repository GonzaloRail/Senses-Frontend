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
  leadMinutes: number;
  channel: AppointmentReminderChannel;
  scheduledAt: string;
  status: AppointmentReminderStatus;
  attempts: number;
  recipient: string | null;
  provider: string | null;
  providerStatus: string | null;
  acceptedAt: string | null;
  deliveredAt: string | null;
  lastError: string | null;
  appointment: {
    startDate: string;
    confirmedAt: string | null;
    declinedAt: string | null;
    patient: { firstName: string; lastName: string };
    user: { firstName: string; lastName: string };
    office: { name: string; location: { name: string } };
  };
}

// Backend contract: GET /api/v1/appointment-reminders returns { reminders: AppointmentReminder[] }.
export const getAppointmentRemindersApi = async () => {
  const response = await api.get<{ reminders: AppointmentReminder[] }>(
    "/api/v1/appointment-reminders"
  );
  return response.data.reminders;
};
