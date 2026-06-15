import { useMutation } from "@tanstack/react-query";
import {
  createEmployeeLeaveApi,
  updateEmployeeLeaveApi,
  updateEmployeeLeaveStatusApi,
} from "../api/employeeLeavesApi";
import { queryClient } from "@/lib/queryClient";

export const useCreateEmployeeLeave = () => {
  return useMutation({
    mutationFn: createEmployeeLeaveApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-leaves"] });
    },
  });
};

export const useUpdateEmployeeLeaveStatus = () => {
  return useMutation({
    mutationFn: updateEmployeeLeaveStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee-leave", data.id] });
    },
  });
};

export const useUpdateEmployeeLeave = () => {
  return useMutation({
    mutationFn: updateEmployeeLeaveApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee-leave", data.id] });
    },
  });
};
