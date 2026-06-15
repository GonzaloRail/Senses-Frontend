import { useQuery } from "@tanstack/react-query";
import {
  getAllUsersPaginatedApi,
  getUserByIdApi,
  searchPsychologistByName,
  searchPsychologistsAvailable,
  searchUsersByQuery,
  type UserByIdQuery,
  type UsersPaginatedQuery,
} from "../api/systemUsersApi";
import type { User, UserMinimal } from "@/shared/interfaces/models";
import { useCallback, useState } from "react";

export const useUsersPaginatedQuery = ({ page, take }: UsersPaginatedQuery) => {
  return useQuery<UsersPaginatedQuery>({
    queryKey: ["users", page],
    queryFn: () => getAllUsersPaginatedApi({ page, take }),
    enabled: false,
  });
};

export const useUserByIdQuery = ({ id }: Partial<UserByIdQuery>) => {
  return useQuery<Partial<User>>({
    queryKey: ["user", id],
    queryFn: () => {
      if (!id) throw new Error("Missing user ID");
      return getUserByIdApi({ id });
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id, // Only run the query if id is provided
  });
};

export const usePsychologistSearchQuery = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentAppointmentId, setCurrentAppointmentId] = useState<
    string | undefined
  >();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const {
    data: psychologists = [],
    isLoading,
    error,
  } = useQuery<UserMinimal[]>({
    queryKey: [
      "psychologists",
      "search",
      searchQuery,
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    queryFn: () => {
      if (!startDate || !endDate) {
        throw new Error("Both startDate and endDate must be provided");
      }

      console.log("Sending to backend (UTC):", {
        searchQuery,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return searchPsychologistsAvailable(
        searchQuery,
        startDate,
        endDate,
        currentAppointmentId
      );
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });

  // CAMBIO IMPORTANTE: NO convertir a zona horaria, usar las fechas tal como vienen
  const stableSetStartDate = useCallback((date: Date) => {
    console.log("Setting start date (keeping as is):", date.toISOString());
    setStartDate(date); // Sin toZonedTime
  }, []);

  const stableSetEndDate = useCallback((date: Date) => {
    console.log("Setting end date (keeping as is):", date.toISOString());
    setEndDate(date); // Sin toZonedTime
  }, []);

  const stableSetSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  const stableSetCurrentAppointmentId = useCallback(
    (id: string | undefined) => {
      setCurrentAppointmentId(id);
    },
    []
  );

  return {
    psychologists,
    isLoading,
    error,
    setStartDate: stableSetStartDate,
    setEndDate: stableSetEndDate,
    setSearch: stableSetSearch,
    setCurrentAppointmentId: stableSetCurrentAppointmentId,
  };
};

export const usePsychologistSearchByNameQuery = () => {
  const [searchName, setSearchQuery] = useState<string>("");

  const {
    data: psychologists = [],
    isLoading,
    error,
  } = useQuery<UserMinimal[]>({
    queryKey: ["psychologists", "search", searchName],
    queryFn: () => searchPsychologistByName(searchName),
    //enabled: searchName.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    psychologists,
    isLoading,
    error,
    setSearchQuery,
  };
}

export const useUsersSearchQuery = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [currentAppointmentId, setCurrentAppointmentId] = useState<
  //   string | undefined
  // >();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<UserMinimal[]>({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => {
      console.log("Sending to backend (UTC):", {
        searchQuery,
      });

      return searchUsersByQuery(
        searchQuery
        // currentAppointmentId
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const stableSetSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    users,
    isLoading,
    error,
    setSearch: stableSetSearch,
  };
};
