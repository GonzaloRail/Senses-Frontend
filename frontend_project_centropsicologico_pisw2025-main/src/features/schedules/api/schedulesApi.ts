import api from "@/api/api";

export interface PaginatedQuery {
  page: number;
  take: number;
  search?: string;
}

export const getAllPsychologistApi = async ({
  page,
  take,
  search = "",
}: PaginatedQuery) => {
  const response = await api.get(`/api/v1/users/all-psychologist`, {
    params: {
      page,
      take,
      search,
    },
  });
  return response.data;
};

export const getAllOfficeApi = async ({
  page,
  take,
  search = "",
}: PaginatedQuery) => {
  const response = await api.get(`/api/v1/offices`, {
    params: {
      page,
      take,
      search,
    },
  });
  return response.data;
};

export const getAppointmentEventsByPsychologistApi = async (psychologistId: string) => {
  const response = await api.get(`/api/v1/appointments/psychologist/${psychologistId}`);
  return response.data;
}

export const getAppointmentEventsByOfficeApi = async (officeId: string) => {
  const response = await api.get(`/api/v1/appointments/office/${officeId}`);
  return response.data;
}

// refactor this function to offices feature
export const getOfficeNameByIdApi = async (officeId: string) => {
  const response = await api.get(`/api/v1/offices/${officeId}`);
  return response.data;
}