import type { MinimalOffice } from "@/shared/interfaces/models";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getAllOfficesPaginatedApi, getOfficeByIdApi, searchOfficesAvailable, searchOfficesByName, type OfficesPaginatedQuery } from "../api/officesApi";
import type { LocationByIdQuery } from "@/features/locations/api/locationsApi";

export const useOfficesPaginatedQuery = ({
  page,
  take
}: OfficesPaginatedQuery) => {
  return useQuery<OfficesPaginatedQuery>({
    queryKey: ["offices", page],
    queryFn: () => getAllOfficesPaginatedApi({ page, take }),
    enabled: false
  })
}

export const useOfficeSearchQuery = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [currentAppointmentId, setCurrentAppointmentId] = useState<
    string | undefined
  >();

  const {
    data: offices = [],
    isLoading,
    error,
  } = useQuery<MinimalOffice[]>({
    queryKey: [
      "offices",
      "search",
      searchQuery,
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    queryFn: () => {
      if (!startDate || !endDate) {
        throw new Error("Both startDate and endDate must be provided");
      }

      console.log("Sending office search to backend (UTC):", {
        searchQuery,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return searchOfficesAvailable(
        searchQuery,
        startDate,
        endDate,
        currentAppointmentId
      );
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });

  const stableSetStartDate = useCallback((date: Date) => {
    console.log("Setting office start date:", date.toISOString());
    setStartDate(date);
  }, []);

  const stableSetEndDate = useCallback((date: Date) => {
    console.log("Setting office end date:", date.toISOString());
    setEndDate(date);
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
    offices,
    isLoading,
    error,
    setStartDate: stableSetStartDate,
    setEndDate: stableSetEndDate,
    setSearch: stableSetSearch,
    setCurrentAppointmentId: stableSetCurrentAppointmentId,
  };
};

export const useOfficeByIdQuery = ({id}: Partial<LocationByIdQuery>) => {
  return useQuery({
    queryKey: ["office", id],
    queryFn: () => {
      if (!id) throw new Error("Missing office ID");
      return getOfficeByIdApi(id)
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id, // Only run the query if id is provided
  })
}

export const useOfficesSearchQuery = () => {
  const [searchName, setNameQuery] = useState<string>("");

  const {
    data: offices = [],
    isLoading,
    error,
  } = useQuery<MinimalOffice[]>({
    queryKey: ["offices", searchName],
    queryFn: () => searchOfficesByName(searchName),
    //enabled: searchName.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    offices,
    isLoading,
    error,
    setNameQuery,
  };
};

