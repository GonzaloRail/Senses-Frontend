import { useMutation } from "@tanstack/react-query";
import { createLocationApi, updateLocationApi } from "../api/locationsApi";
import { queryClient } from "@/lib/queryClient";

export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: updateLocationApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["location", data.id] });
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    },
  });
};

export const useCreateLocation = () => {
  return useMutation({
    mutationFn: createLocationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};
