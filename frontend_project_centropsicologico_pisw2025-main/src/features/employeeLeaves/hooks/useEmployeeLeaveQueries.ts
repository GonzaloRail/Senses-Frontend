import type { GetEmployeeLeaveByIdResponse } from "@/shared/interfaces/apiResponses/getEmployeeLeaveByIdResposne";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getEmployeeLeaveByIdApi } from "../api/employeeLeavesApi";

export const useGetEmployeeLeaveById = (
  id: string | undefined,
  config?: Omit<
    UseQueryOptions<GetEmployeeLeaveByIdResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<GetEmployeeLeaveByIdResponse>({
    queryKey: ["employee-leave", id],
    queryFn: () => {
      if (!id) throw new Error("Missing employee leave ID");
      return getEmployeeLeaveByIdApi(id);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
    ...config, // Spread las opciones adicionales
  });
};
