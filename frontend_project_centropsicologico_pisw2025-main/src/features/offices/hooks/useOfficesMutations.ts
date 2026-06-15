import { useMutation } from "@tanstack/react-query";
import { createOfficeApi, updateOfficeApi } from "../api/officesApi";
import { queryClient } from "@/lib/queryClient";

export const useUpdateOffice = () => {
  return useMutation({
    mutationFn: updateOfficeApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["office", data.id] });
    },
  });
};

export const useCreateOffice = () => {
  return useMutation({
    mutationFn: createOfficeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
  });
};
