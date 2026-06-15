import type { ClinicalHistory, Section } from "@/shared/interfaces/models";
import { useQuery } from "@tanstack/react-query";
import {
  getAllEvaluationsByClinicalHistoryIdSortedBySectionApi,
  getClinicalHistoryByIdApi,
} from "../api/clinicalHistoriesApi";

export const useClinicalHistoryByIdQuery = (id: string) => {
  return useQuery<ClinicalHistory>({
    queryKey: ["clinical-history", id],
    queryFn: () => {
      if (!id) throw new Error("Missing clinical history ID");
      return getClinicalHistoryByIdApi(id);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id, // Only run the query if id is provided
  });
};
export const useGetAllEvaluationsByClinicalHistoryIdSortedBySectionQuery = (
  id: string
) => {
  return useQuery<Section[]>({
    queryKey: ["clinical-history-sorted", id],
    queryFn: () => {
      if (!id) throw new Error("Missing clinical history ID");
      return getAllEvaluationsByClinicalHistoryIdSortedBySectionApi(id);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!id, // Only run the query if id is provided
  });
};
