import api from "@/api/api";
import type { Location } from "@/shared/interfaces/models";

export interface LocationsPaginatedQuery {
  page: number;
  take: number;
}

export const getAllLocationsPaginatedApi = async ({
  page,
  take,
}: LocationsPaginatedQuery) => {
  const response = await api.get(`/api/v1/locations`, {
    params: {
      page,
      take,
    },
  });
  return response.data;
};

export interface LocationByIdQuery {
  id: string;
}

export const getLocationByIdApi = async ({ id }: LocationByIdQuery) => {
  const response = await api.get(`/api/v1/locations/${id}`);
  return response.data;
};

export interface LocationUpdateMutation {
  id: string;
  locationToUpdate: Partial<Location>;
}

export const updateLocationApi = async ({
  id,
  locationToUpdate,
}: LocationUpdateMutation) => {
  const response = await api.put(`/api/v1/locations/${id}`, locationToUpdate);

  return response.data;
};

export const createLocationApi = async (
  locationToCreate: Partial<Location>
) => {
  const response = await api.post(`/api/v1/locations`, locationToCreate);

  return response.data;
};

export const searchLocationsByName = async (name: string) => {
  const response = await api.get(`/api/v1/locations/search`, {
    params: {
      name,
    },
  });

  return response.data;
};
