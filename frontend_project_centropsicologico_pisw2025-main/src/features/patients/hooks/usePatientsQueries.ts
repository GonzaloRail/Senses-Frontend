import { useQuery } from "@tanstack/react-query";
import {
  getPatientByIdApi,
  searchPatientsApi,
  type PatientByIdQuery,
  type PatientSearchQuery,
  type PatientsPaginatedQuery,
} from "../api/patientsApi";
import { getAllUsersPaginatedApi } from "@/features/systemUsers/api/systemUsersApi";
import type { Patient, PatientMinimal } from "@/shared/interfaces/models";
import { useState } from "react";

export const usePatientsPaginatedQuery = ({
  page,
  take,
}: PatientsPaginatedQuery) => {
  return useQuery<PatientsPaginatedQuery>({
    queryKey: ["patients", page],
    queryFn: () => getAllUsersPaginatedApi({ page, take }),
  });
};

export const usePatientByIdQuery = ({ id }: PatientByIdQuery) => {
  return useQuery<Partial<Patient>>({
    queryKey: ["patient", id],
    queryFn: () => {
      if (!id) throw new Error("Missing patient ID");
      return getPatientByIdApi({ id });
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id, // Only run the query if id is provided
  });
};

export const usePatientSearchQuery = () => {
  const [searchFilters, setSearchFilters] = useState<PatientSearchQuery>({
    dni: "",
    firstname: "",
    lastname: "",
  });

  const normalizedDni = searchFilters.dni?.trim() ?? "";
  const normalizedFirstname = searchFilters.firstname?.trim() ?? "";
  const normalizedLastname = searchFilters.lastname?.trim() ?? "";

  const {
    data: patients = [],
    isLoading,
    error,
  } = useQuery<PatientMinimal[]>({
    queryKey: [
      "patients",
      "search",
      normalizedDni,
      normalizedFirstname,
      normalizedLastname,
    ],
    queryFn: () =>
      searchPatientsApi({
        dni: normalizedDni,
        firstname: normalizedFirstname,
        lastname: normalizedLastname,
      }),
    enabled:
      normalizedDni.length > 0 ||
      normalizedFirstname.length > 0 ||
      normalizedLastname.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    patients,
    isLoading,
    error,
    setSearchFilters,
  };
};
