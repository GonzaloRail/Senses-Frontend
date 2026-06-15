import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { createItemApi, updateItemApi } from "../api/itemsApi";

export const useUpdateItem = () => {
  return useMutation({
    mutationFn: updateItemApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["item", data.id] });
      // Invalidar todas las consultas de búsqueda de items
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
  });
};

export const useCreateItem = () => {
  return useMutation({
    mutationFn: createItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};