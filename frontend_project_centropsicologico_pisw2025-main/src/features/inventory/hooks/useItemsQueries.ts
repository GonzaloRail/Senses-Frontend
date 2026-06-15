import { useQuery } from "@tanstack/react-query";
import {
  getAllItemsPaginatedApi,
  getItemByIdApi,
  searchItemsByName,
  type ItemByIdQuery,
  type ItemsPaginatedQuery,
} from "../api/itemsApi";
import type { Item, ItemMinimal } from "@/shared/interfaces/models";
import { useState } from "react";

export const useItemsPaginatedQuery = ({ page, take }: ItemsPaginatedQuery) => {
  return useQuery<ItemsPaginatedQuery>({
    queryKey: ["items", page],
    queryFn: () => getAllItemsPaginatedApi({ page, take }),
    enabled: false,
  });
};

export const useItemByIdQuery = ({id}: Partial<ItemByIdQuery>) => {
  return useQuery<Partial<Item>>({
    queryKey: ["item", id],
    queryFn: () => {
      if (!id) throw new Error("Missing item ID");
      return getItemByIdApi(id)
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  })
}

export const useItemsSearchQuery = () => {
  const [searchName, setNameQuery] = useState<string>("");

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery<ItemMinimal[]>({
    queryKey: ["items", searchName],
    queryFn: () => searchItemsByName(searchName),
    //enabled: searchName.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    items,
    isLoading,
    error,
    setNameQuery,
  };
};
