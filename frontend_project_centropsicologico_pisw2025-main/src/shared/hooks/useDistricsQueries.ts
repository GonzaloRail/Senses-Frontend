import { useQuery } from "@tanstack/react-query";
import { getDistrictsByProvinceIdApi } from "../api";
import type { District } from "../interfaces/models";

export const useDistrictsByProvinceIdQuery = (id: string) => {
  return useQuery<District[]>({
    queryKey: ["districts", "province", id],
    queryFn: () => getDistrictsByProvinceIdApi(id),
  });
};
