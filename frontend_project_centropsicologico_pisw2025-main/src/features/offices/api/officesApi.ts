import api from "@/api/api";
import type { Office } from "@/shared/interfaces/models";

export interface OfficesPaginatedQuery {
  page: number;
  take: number;
}

export const getAllOfficesPaginatedApi = async ({
  page,
  take,
}: OfficesPaginatedQuery) => {
  const response = await api.get(`/api/v1/offices`, {
    params: {
      page,
      take,
    },
  });

  return response.data;
};

export const getOfficeByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/offices/${id}`);
  return response.data;
};

export interface OfficeUpdateMutation {
  id: string;
  officeToUpdate: Partial<Office>;
}

export const updateOfficeApi = async ({
  id,
  officeToUpdate,
}: OfficeUpdateMutation) => {
  const response = await api.put(`/api/v1/offices/${id}`, officeToUpdate);
  return response.data;
};

export const createOfficeApi = async (office: Partial<Office>) => {
  const response = await api.post(`/api/v1/offices`, office);

  return response.data;
};

export const searchOfficesAvailable = async (
  searchQuery: string,
  startDate: Date,
  endDate: Date,
  currentAppointmentId: string | undefined
) => {
  const response = await api.get(`/api/v1/offices/search`, {
    params: {
      searchQuery,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currentAppointmentId,
    },
  });

  return response.data;
};

export const searchOfficesByName = async (name: string) => {
  const response = await api.get(`/api/v1/offices/search-all`, {
    params: {
      name,
    },
  });

  return response.data;
};

