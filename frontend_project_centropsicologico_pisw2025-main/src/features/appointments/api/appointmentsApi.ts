import api from "@/api/api";
import type {
  AppointmentStatus,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from "@/shared/interfaces/models";

export interface AppointmentsPaginatedQuery {
  page: number;
  take: number;
  search?: string;
}

export const getAllAppointmentsPaginatedApi = async ({
  page,
  take,
  search = "",
}: AppointmentsPaginatedQuery) => {
  const response = await api.get(`/api/v1/appointments`, {
    params: {
      page,
      take,
      search,
    },
  });
  return response.data;
};

export interface AppointmentsByDatePaginatedQuery {
  page: number;
  take: number;
  from?: string;
  to?: string;
}

export const getAppointmentsByDateApi = async ({
  page,
  take,
  from,
  to,
}: AppointmentsByDatePaginatedQuery) => {
  const response = await api.get(`/api/v1/appointments/by_date`, {
    params: {
      page,
      take,
      from,
      to,
    },
  });
  return response.data;
};


export const createAppointmentApi = async (data: CreateAppointmentPayload) => {
  const response = await api.post(`/api/v1/appointments`, data);
  return response.data;
};

export const getAppointmentByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/appointments/${id}`);
  return response.data;
};

export const updateAppointmentStatusApi = async ({
  id,
  status,
}: {
  id: string;
  status: AppointmentStatus;
}) => {
  const response = await api.put(`/api/v1/appointments/status/${id}`, {
    status,
  });
  return response.data;
};

export const updateAppointmentApi = async ({
  id,
  appointmentToUpdate,
}: {
  id: string;
  appointmentToUpdate: UpdateAppointmentPayload;
}) => {
  const response = await api.put(`/api/v1/appointments/${id}`, {
    ...appointmentToUpdate,
  });

  return response.data;
};

export const updatePatientPsychologistIdApi = async ({
  patientId,
  psychologistId,
}: {
  patientId: string;
  psychologistId: string;
}) => {
  const response = await api.put(
    `/api/v1/patients/${patientId}`,
    { psychologistId }
  );
  return response.data;
}
