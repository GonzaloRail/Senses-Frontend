import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingresosApi } from "../api/ingresosApi";
import { invalidateFinancialQueries } from "@/shared/utils/invalidateFinancialQueries";
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
    onSuccess: () => invalidateFinancialQueries(queryClient),
  });
};

export const useCreateChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incomeId, payload }: { incomeId: string; payload: CreateChangeRequestPayload }) =>
      ingresosApi.createChangeRequest(incomeId, payload),
    onSuccess: () => invalidateFinancialQueries(queryClient),
  });
};

export const useReviewChangeRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: ReviewChangeRequestPayload }) =>
      ingresosApi.reviewChangeRequest(requestId, payload),
    onSuccess: () => invalidateFinancialQueries(queryClient),
  });
};

export const useConfigureBilling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: ConfigureBillingPayload }) =>
      ingresosApi.configureAppointmentBilling(appointmentId, payload),
    onSuccess: () => invalidateFinancialQueries(queryClient),
  });
};
