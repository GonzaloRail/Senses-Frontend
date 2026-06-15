import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { updateItemInstancesApi } from "../api/itemInstancesApi";

export const useUpdateItemInstances = () => {
  return useMutation({
    mutationFn: updateItemInstancesApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["item-instances", data.id] });
      // Invalidar todas las consultas de búsqueda de items
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
    
  });
};


