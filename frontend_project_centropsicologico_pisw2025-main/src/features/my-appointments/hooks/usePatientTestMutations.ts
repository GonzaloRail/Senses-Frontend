import { useMutation } from "@tanstack/react-query";
import {
  createPatientTestApi,
  updatePatientTestApi,
} from "../api/myAppointmentsApi";
import { queryClient } from "@/lib/queryClient";

export const useCreatePatientTest = () => {
  return useMutation({
    mutationFn: createPatientTestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history-sorted"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history"] });
    },
  });
};

export const useUpdatePatientTest = () => {
  return useMutation({
    mutationFn: updatePatientTestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-history-sorted"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history"] });
    },
  });
};
