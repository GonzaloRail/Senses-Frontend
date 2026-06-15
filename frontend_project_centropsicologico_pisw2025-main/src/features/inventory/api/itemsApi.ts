import api from "@/api/api";
import type { Item } from "@/shared/interfaces/models";

export interface ItemsPaginatedQuery {
  page: number;
  take: number;
}

export const getAllItemsPaginatedApi = async ({
  page,
  take,
}: ItemsPaginatedQuery) => {
  const response = await api.get(`/api/v1/items`, {
    params: {
      page,
      take,
    },
  });
  return response.data;
};

export interface ItemByIdQuery {
  id: string;
}

export const getItemByIdApi = async (itemId: string) => {
  const response = await api.get(`/api/v1/items/${itemId}`);
  return response.data;
};

interface ItemUpdateMutation {
  id: string;
  itemToUpdate: Partial<Item>;
}

export const updateItemApi = async ({
  id,
  itemToUpdate,
}: ItemUpdateMutation) => {
  const response = await api.put(`/api/v1/items/${id}`, itemToUpdate);
  
  return response.data;
};

export const createItemApi = async (itemToCreate: Partial<Item>) => {
  const response = await api.post(`/api/v1/items`, itemToCreate);
  return response.data;
};

export const searchItemsByName = async (name: string) => {
  const response = await api.get(`/api/v1/items/search`, {
    params: {
      name,
    },
  });

  return response.data;
};

