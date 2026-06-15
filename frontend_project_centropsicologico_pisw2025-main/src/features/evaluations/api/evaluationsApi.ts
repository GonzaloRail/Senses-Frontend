import api from "@/api/api";
import type {
  CreateEvaluationPayload,
  UpdateEvaluationPayload,
} from "@/shared/interfaces/models";

export interface PaginatedQuery {
  page: number;
  take: number;
  search?: string;
}

export const getAllEvaluationsApi = async ({
  page,
  take,
  search = "",
}: PaginatedQuery) => {
  const response = await api.get(`/api/v1/evaluations/list`, {
    params: {
      page,
      take,
      search,
    },
  });
  return response.data;
};

export const getEvaluationByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/evaluations/${id}`);
  return response.data;
};

export const getSectionsOrdersApi = async () => {
  const response = await api.get(`/api/v1/evaluations/sections/orders`);
  return response.data;
};

interface SectionOrderUpdate {
  evaluations: { id: string; sectionOrder: number }[];
}

export const updateSectionsOrdersApi = async ({
  evaluations,
}: SectionOrderUpdate) => {
  const response = await api.put(`/api/v1/evaluations/sections/orders`, {
    evaluations,
  });
  return response.data;
};

export const createEvaluationApi = async ({
  evaluationToCreate,
}: {
  evaluationToCreate: CreateEvaluationPayload;
}) => {
  const response = await api.post(`/api/v1/evaluations`, {
    ...evaluationToCreate,
  });

  return response.data;
};

export const updateEvaluationApi = async ({
  id,
  evaluationToUpdate,
}: {
  id: string;
  evaluationToUpdate: UpdateEvaluationPayload;
}) => {
  const response = await api.put(`/api/v1/evaluations/${id}`, {
    ...evaluationToUpdate,
  });

  return response.data;
};

export const updateEvaluationStatusApi = async ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) => {
  const response = await api.put(`/api/v1/evaluations/status/${id}`, {
    isActive,
  });
  return response.data;
};
