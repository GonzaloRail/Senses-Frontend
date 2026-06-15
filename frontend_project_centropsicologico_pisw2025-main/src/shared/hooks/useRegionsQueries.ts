import { useQuery } from "@tanstack/react-query";
import { getAllRegionsApi, getRegionByIdApi } from "../api";
import type { Region } from "../interfaces/models";

export const useGetAllRegionsQuery = () => {
  return useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: () => getAllRegionsApi(),
  });
};

export const useGetRegionByIdQuery = (id: string) => {
  return useQuery<Region>({
    queryKey: ["region", id],
    queryFn: () => getRegionByIdApi(id),
  });
};
