import type { SectionToDoSort } from "@/shared/interfaces/models";
import { useQuery } from "@tanstack/react-query";
import { getSectionsOrdersApi } from "../api/evaluationsApi";

export const useGetSectionsOrders = () => {
  return useQuery<SectionToDoSort[]>({
    queryKey: ["sections"],
    queryFn: () => getSectionsOrdersApi(),
    staleTime: 1000 * 60 * 5,
  });
};
