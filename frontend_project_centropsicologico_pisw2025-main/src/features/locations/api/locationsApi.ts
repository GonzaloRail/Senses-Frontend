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

/** Loads every page: the search endpoint is limited to ten results. */
export const getAllActiveLocationsApi = async (): Promise<{ id: string; name: string }[]> => {
  const locations: { id: string; name: string; isActive: boolean }[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await getAllLocationsPaginatedApi({ page, take: 100 });
    if (!Array.isArray(result.locations) || !Number.isInteger(result.totalPages) || result.totalPages < 0 ||
        !result.locations.every((location: unknown) => {
          if (!location || typeof location !== "object") return false;
          const item = location as Record<string, unknown>;
          return typeof item.id === "string" && typeof item.name === "string" && typeof item.isActive === "boolean";
        })) {
      throw new Error("La respuesta del catálogo de sedes no es válida");
    }
    locations.push(...result.locations);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return locations.filter((location) => location.isActive).map(({ id, name }) => ({ id, name }));
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
