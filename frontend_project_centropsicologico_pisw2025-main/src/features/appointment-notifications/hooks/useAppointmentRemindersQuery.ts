import { useQuery } from "@tanstack/react-query";
import { getAppointmentRemindersApi } from "../api/appointmentNotificationsApi";

export const APPOINTMENT_REMINDERS_QUERY_KEY = ["appointment-reminders"] as const;

export const useAppointmentRemindersQuery = () =>
  useQuery({
    queryKey: APPOINTMENT_REMINDERS_QUERY_KEY,
    queryFn: getAppointmentRemindersApi,
    refetchInterval: 30_000,
  });
