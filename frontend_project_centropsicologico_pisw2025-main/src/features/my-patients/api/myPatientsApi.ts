import api from "@/api/api";

export interface GetPatientsByPsychologistRequest {
  psychologistId: string;
  take: number;
  page: number;
  search?: string;
}
export interface GetMyPatientListRequest {
  psychologistId: string;
  take: number;
  page: number;
  search?: string;
}
export const getPatientsByPsychologistIdApi = async ({
  page,
  psychologistId,
  take,
  search,
}: GetPatientsByPsychologistRequest) => {
  const response = await api.get(
    `/api/v1/patients/psychologist/${psychologistId}`,
    {
      params: {
        page,
        take,
        search,
      },
    }
  );
  return response.data;
};

export const getMyPatientListApi = async ({
  page,
  psychologistId,
  take,
  search,
}: GetMyPatientListRequest) => {
  const response = await api.get(
    `/api/v1/patients/list/${psychologistId}`,
    {
      params: {
        page,
        take,
        search,
      },
    }
  );
  return response.data;
};
