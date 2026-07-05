import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingresosApi } from "../api/ingresosApi";
import { INGRESOS_QUERY_KEY } from "./useIngresosQueries";
import type {
  CreateIncomePayload,
  CreateChangeRequestPayload,
  ReviewChangeRequestPayload,
  ConfigureBillingPayload,
} from "@/shared/interfaces/models/IncomeReceipt";

export const useCreateIngreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIncomePayload) => ingresosApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGRESOS_QUERY_KEY });
    },
  });
};

export const useCreateChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incomeId, payload }: { incomeId: string; payload: CreateChangeRequestPayload }) =>
      ingresosApi.createChangeRequest(incomeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGRESOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
    },
  });
};

export const useReviewChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: ReviewChangeRequestPayload }) =>
      ingresosApi.reviewChangeRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGRESOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["change-requests"] });
    },
  });
};

export const useConfigureBilling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: ConfigureBillingPayload }) =>
      ingresosApi.configureAppointmentBilling(appointmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};
