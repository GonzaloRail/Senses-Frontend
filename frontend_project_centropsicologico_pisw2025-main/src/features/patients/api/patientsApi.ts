import api from "@/api/api";
import type { Patient } from "@/shared/interfaces/models";

export interface PatientsPaginatedQuery {
  page: number;
  take: number;
  dni?: string;
  firstname?: string;
  lastname?: string;
  search?: string;
}

export const getAllPatientsApi = async ({
  page,
  take,
  dni = "",
  firstname = "",
  lastname = "",
  search = "",
}: PatientsPaginatedQuery) => {
  const response = await api.get(`/api/v1/patients`, {
    params: {
      page,
      take,
      dni,
      firstname,
      lastname,
      search,
    },
  });
  return response.data;
};

export interface PatientByIdQuery {
  id: string;
}

export const getPatientByIdApi = async ({ id }: PatientByIdQuery) => {
  const response = await api.get(`/api/v1/patients/${id}`);
  return response.data;
};

export interface PatientUpdateMutation {
  id: string;
  patientToUpdate: Partial<Patient>;
}

export const updatePatientApi = async ({
  id,
  patientToUpdate,
}: PatientUpdateMutation) => {
  const response = await api.put(`/api/v1/patients/${id}`, patientToUpdate);

  return response.data;
};

export const createPatientApi = async (patientToCreate: Partial<Patient>) => {
  const response = await api.post(`/api/v1/patients`, patientToCreate);

  return response.data;
};

export interface PatientSearchQuery {
  dni?: string;
  firstname?: string;
  lastname?: string;
}

export const searchPatientsApi = async ({
  dni = "",
  firstname = "",
  lastname = "",
}: PatientSearchQuery) => {
  const response = await api.get(`/api/v1/patients/search`, {
    params: {
      dni,
      firstname,
      lastname,
    },
  });

  return response.data;
};

export const exportPatientsToExcelApi = async () => {
  const response = await api.get(`/api/v1/patients/download-report`, {
    responseType: "blob",
  });
  return response.data;
}
