import { useMutation } from "@tanstack/react-query";
import { createUserApi, updateUserApi } from "../api/systemUsersApi";
import { queryClient } from "@/lib/queryClient";

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user", data.id] });
    },
  });
};

export const useCreateUser = () => {
  return useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
