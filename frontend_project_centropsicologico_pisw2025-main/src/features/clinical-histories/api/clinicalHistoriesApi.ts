import api from "@/api/api";

export interface ClinicalHistoriesPaginatedQuery {
  page: number;
  take: number;
  search?: string;
}

export const getAllClinicalHistoriesPaginatedApi = async ({
  page,
  take,
  search
}: ClinicalHistoriesPaginatedQuery) => {
  const response = await api.get(`/api/v1/clinical-histories`, {
    params: {
      page,
      take,
      search
    },
  });
  return response.data;
};

export const getClinicalHistoryByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/clinical-histories/${id}`);

  return response.data;
};
export const getAllEvaluationsByClinicalHistoryIdSortedBySectionApi = async (
  id: string
) => {
  const response = await api.get(
    `/api/v1/evaluations/clinical-history/${id}/sections/sorted`
  );

  return response.data;
};
