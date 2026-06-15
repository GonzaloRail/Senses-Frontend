import { useQuery } from "@tanstack/react-query";
import {
  getAllLocationsPaginatedApi,
  getLocationByIdApi,
  searchLocationsByName,
  type LocationByIdQuery,
  type LocationsPaginatedQuery,
} from "../api/locationsApi";
import type { Location, LocationMinimal } from "@/shared/interfaces/models";
import { useState } from "react";

export const useLocationsPaginatedQuery = ({
  page,
  take,
}: LocationsPaginatedQuery) => {
  return useQuery<LocationsPaginatedQuery>({
    queryKey: ["locations", page],
    queryFn: () => getAllLocationsPaginatedApi({ page, take }),
    enabled: false,
  });
};

export const useLocationByIdQuery = ({ id }: Partial<LocationByIdQuery>) => {
  return useQuery<Partial<Location>>({
    queryKey: ["location", id],
    queryFn: () => {
      if (!id) throw new Error("Missing location ID");
      return getLocationByIdApi({ id });
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id, // Only run the query if id is provided
  });
};

export const useLocationSearchQuery = () => {
  const [searchName, setNameQuery] = useState<string>("");

  const {
    data: locations = [],
    isLoading,
    error,
  } = useQuery<LocationMinimal[]>({
    queryKey: ["locations", searchName],
    queryFn: () => searchLocationsByName(searchName),
    //enabled: searchName.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    locations,
    isLoading,
    error,
    setNameQuery,
  };
};
