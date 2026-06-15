import { useQuery } from "@tanstack/react-query";
import {
  getPatientByIdApi,
  searchPatientsByDniOrName,
  type PatientByIdQuery,
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
  const [searchDni, setDniQuery] = useState<string>("");
  const [searchName, setNameQuery] = useState<string>("");

  const {
    data: patients = [],
    isLoading,
    error,
  } = useQuery<PatientMinimal[]>({
    queryKey: ["patients", searchName, searchDni],
    queryFn: () => searchPatientsByDniOrName(searchDni, searchName),
    enabled: searchDni.trim().length > 0 || searchName.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    patients,
    isLoading,
    error,
    setDniQuery,
    setNameQuery,
  };
};
