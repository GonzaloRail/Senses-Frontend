import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingresosApi } from "../api/ingresosApi";
import { INGRESOS_QUERY_KEY } from "./useIngresosQueries";
import type { CreateIncomeReceiptInput } from "@/shared/interfaces/models/IncomeReceipt";

export const useCreateIngreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIncomeReceiptInput) => ingresosApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGRESOS_QUERY_KEY });
    },
  });
};

export const useAnnulIngreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ingresosApi.annul(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGRESOS_QUERY_KEY });
    },
  });
};

export const useDeleteIngreso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ingresosApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGRESOS_QUERY_KEY });
    },
  });
};
