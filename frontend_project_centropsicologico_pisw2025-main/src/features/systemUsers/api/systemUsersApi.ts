import api from "@/api/api";
import type { User, UserRole } from "@/shared/interfaces/models";

export interface UserByIdQuery {
  id: string;
}

export const getUserByIdApi = async ({ id }: UserByIdQuery) => {
  const response = await api.get(`/api/v1/users/${id}`);
  return response.data;
};

export interface UsersPaginatedQuery {
  page: number;
  take: number;
  search?: string;
}

export const getAllUsersPaginatedApi = async ({
  page,
  take,
  search = "",
}: UsersPaginatedQuery) => {
  const response = await api.get(`/api/v1/users`, {
    params: {
      page,
      take,
      search,
    },
  });
  return response.data;
};

type UserToUpdateType = Omit<Partial<User>, "roles" | "documents"> & {
  roles?: Partial<UserRole>[];
  documents?: (Partial<Document> & { fileObject?: File })[]; // Para guardar el archivo momentaneamente
};
export interface UserUpdateMutation {
  id: string;
  userToUpdate: UserToUpdateType;
}

export const updateUserApi = async ({
  id,
  userToUpdate,
}: UserUpdateMutation) => {
  const response = await api.put(`/api/v1/users/${id}`, userToUpdate);
  return response.data;
};

export const createUserApi = async (userToCreate: Partial<User>) => {
  const response = await api.post(`/api/v1/users`, userToCreate);

  return response.data;
};

export const searchPsychologistsAvailable = async (
  searchQuery: string,
  startDate: Date,
  endDate: Date,
  currentAppointmentId?: string
) => {
  const response = await api.get(`/api/v1/users/available-psychologist/search`, {
    params: {
      searchQuery,
      startDate,
      endDate,
      currentAppointmentId,
    },
  });

  return response.data;
};

export const searchPsychologistByName = async (searchQuery: string) => {
  const response = await api.get(`/api/v1/users/psychologist/search`, {
    params: {
      searchQuery,
    },
  });

  return response.data;
};

export const searchUsersByQuery = async (searchQuery: string) => {
  const response = await api.get(`/api/v1/users/search`, {
    params: {
      searchQuery,
    },
  });

  return response.data;
};
