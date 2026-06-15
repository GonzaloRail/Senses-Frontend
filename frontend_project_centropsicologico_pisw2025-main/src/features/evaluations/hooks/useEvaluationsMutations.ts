import { useMutation } from "@tanstack/react-query";
import {
  updateEvaluationApi,
  updateEvaluationStatusApi,
  createEvaluationApi,
  updateSectionsOrdersApi,
} from "../api/evaluationsApi";
import { queryClient } from "@/lib/queryClient";
import {
  createTestApi,
  createTestsBatchApi,
  updateTestStatusApi,
} from "../api/testsApi";

export const useCreateEvaluation = () => {
  return useMutation({
    mutationFn: createEvaluationApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation", data.id] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history-sorted"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history"] });
    },
  });
};

export const useUpdateEvaluation = () => {
  return useMutation({
    mutationFn: updateEvaluationApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation", data.id] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};

export const useUpdateSectionsOrders = () => {
  return useMutation({
    mutationFn: updateSectionsOrdersApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history-sorted"] });
    },
  });
};

export const useUpdateEvaluationStatus = () => {
  return useMutation({
    mutationFn: updateEvaluationStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation", data.id] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history-sorted"] });
      queryClient.invalidateQueries({ queryKey: ["clinical-history"] });
    },
  });
};

export const useCreateTest = () => {
  return useMutation({
    mutationFn: createTestApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluation", variables.testToCreate.evaluationId],
      });
    },
  });
};

export const useCreateTestBatch = () => {
  return useMutation({
    mutationFn: createTestsBatchApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluation", data.evaluationId],
      });
    },
  });
};

export const useUpdateTestStatus = () => {
  return useMutation({
    mutationFn: updateTestStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluation", data.evaluationId],
      });
    },
  });
};
