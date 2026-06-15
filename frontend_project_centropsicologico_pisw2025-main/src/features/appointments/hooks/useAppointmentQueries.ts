import type { AppointmentViewResponse } from "@/shared/interfaces/apiResponses/getAppointmentByIdResponse";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getAppointmentByIdApi } from "../api/appointmentsApi";

export const useGetAppointmentById = (
  id: string | undefined,
  config?: Omit<
    UseQueryOptions<AppointmentViewResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<AppointmentViewResponse>({
    queryKey: ["appointment", id],
    queryFn: () => {
      if (!id) throw new Error("Missing appointment ID");
      return getAppointmentByIdApi(id);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
    ...config, // Spread las opciones adicionales
  });
};
