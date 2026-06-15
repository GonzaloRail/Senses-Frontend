import { useQuery } from "@tanstack/react-query";
import { getProvinceByIdApi, getProvincesByRegionIdApi } from "../api";
import type { Province } from "../interfaces/models";

export const useProvincesByRegionIdQuery = (id: string) => {
  return useQuery<Province[]>({
    queryKey: ["provinces", "region", id],
    queryFn: () => getProvincesByRegionIdApi(id),
    enabled: !!id,
  });
};

export const useGetProvinceByIdQuery = (id: string) => {
  return useQuery<Province>({
    queryKey: ["province", id],
    queryFn: () => getProvinceByIdApi(id),
    enabled: !!id,
  });
};
