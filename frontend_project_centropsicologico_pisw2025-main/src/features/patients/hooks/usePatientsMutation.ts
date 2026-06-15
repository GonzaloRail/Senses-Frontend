import { useMutation } from "@tanstack/react-query";
import { createPatientApi, updatePatientApi } from "../api/patientsApi";
import { queryClient } from "@/lib/queryClient";

export const useUpdatePatient = () => {
  return useMutation({
    mutationFn: updatePatientApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patient", data.id] });
    },
  });
};

export const useCreatePatient = () => {
  return useMutation({
    mutationFn: createPatientApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};
