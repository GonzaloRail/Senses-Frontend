import { useQuery } from "@tanstack/react-query";
import { ingresosApi } from "../api/ingresosApi";
import type { IncomeReceiptFilters } from "@/shared/interfaces/models/IncomeReceipt";

export const INGRESOS_QUERY_KEY = ["ingresos"] as const;

export const useIngresosList = () =>
  useQuery({
    queryKey: INGRESOS_QUERY_KEY,
    queryFn: ingresosApi.getAll,
  });

export const useIngresosFiltered = (filters: IncomeReceiptFilters) =>
  useQuery({
    queryKey: [...INGRESOS_QUERY_KEY, "filtered", filters],
    queryFn: () => ingresosApi.getFiltered(filters),
    enabled: true,
  });

export const useIngresoById = (id: string | undefined) =>
  useQuery({
    queryKey: [...INGRESOS_QUERY_KEY, id],
    queryFn: () => ingresosApi.getById(id!),
    enabled: !!id,
  });
