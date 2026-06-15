import { useMutation } from "@tanstack/react-query";
import {
  createAppointmentApi,
  updateAppointmentApi,
  updateAppointmentStatusApi,
} from "../api/appointmentsApi";
import { queryClient } from "@/lib/queryClient";

export const useCreateAppointment = () => {
  return useMutation({
    mutationFn: createAppointmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  return useMutation({
    mutationFn: updateAppointmentStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointment", data.id] });
    },
  });
};

export const useUpdateAppointment = () => {
  return useMutation({
    mutationFn: updateAppointmentApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointment", data.id] });
    },
  });
};
