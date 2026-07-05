import { useQuery } from "@tanstack/react-query";
import { ingresosApi } from "../api/ingresosApi";
import { getAllPsychologistApi } from "@/features/schedules/api/schedulesApi";
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

export const useDailyRegister = (date?: string) =>
  useQuery({
    queryKey: [...INGRESOS_QUERY_KEY, "daily-register", date],
    queryFn: () => ingresosApi.getDailyRegister(date),
    enabled: date !== undefined,
  });

export const usePsychologists = () =>
  useQuery({
    queryKey: ["psychologists"],
    queryFn: async () => {
      const result = await getAllPsychologistApi({ page: 1, take: 100 });
      return result.psychologists ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useAccountingServices = () =>
  useQuery({
    queryKey: ["accounting-services"],
    queryFn: () => ingresosApi.getServices(),
    staleTime: 5 * 60 * 1000,
  });

export const useChangeRequests = (params?: {
  page?: number;
  take?: number;
  status?: string;
  type?: string;
}) =>
  useQuery({
    queryKey: ["change-requests", params],
    queryFn: () => ingresosApi.getChangeRequests(params),
    enabled: params !== undefined,
  });
