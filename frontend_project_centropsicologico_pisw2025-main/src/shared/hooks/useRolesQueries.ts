import { useQuery } from "@tanstack/react-query";
import type { Role } from "../interfaces/models";
import { getAllRolesApi } from "../api";

export const useRolesQuery = () => {
  return useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => getAllRolesApi(),
  });
};
