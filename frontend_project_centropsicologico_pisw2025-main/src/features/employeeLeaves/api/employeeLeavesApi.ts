import api from "@/api/api";
import type {
  CreateEmployeeLeavePayload,
  UpdateEmployeeLeavePayload,
} from "@/shared/interfaces/models";
// import type {
//   AppointmentStatus,
//   CreateAppointmentPayload,
//   UpdateAppointmentPayload,
// } from "@/shared/interfaces/models";

export interface EmployeeLeavesPaginatedQuery {
  page: number;
  take: number;
}

export const getAllEmployeeLeavesPaginatedApi = async ({
  page,
  take,
}: EmployeeLeavesPaginatedQuery) => {
  const response = await api.get(`/api/v1/employee-leaves`, {
    params: {
      page,
      take,
    },
  });
  return response.data;
};

export const createEmployeeLeaveApi = async (
  data: CreateEmployeeLeavePayload
) => {
  const response = await api.post(`/api/v1/employee-leaves`, data);
  return response.data;
};

export const getEmployeeLeaveByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/employee-leaves/${id}`);
  return response.data;
};

export const updateEmployeeLeaveStatusApi = async ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) => {
  const response = await api.put(`/api/v1/employee-leaves/status/${id}`, {
    isActive,
  });
  return response.data;
};

export const updateEmployeeLeaveApi = async ({
  id,
  employeeLeaveToUpdate,
}: {
  id: string;
  employeeLeaveToUpdate: UpdateEmployeeLeavePayload;
}) => {
  const response = await api.put(`/api/v1/employee-leaves/${id}`, {
    ...employeeLeaveToUpdate,
  });

  return response.data;
};
