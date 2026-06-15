import api from "@/api/api";
import type {
  DocumentType,
  EvaluationOption,
  TestOption,
  Document,
  AppointmentStatus,
} from "@/shared/interfaces/models";

export interface MyAppointmentsListPaginatedQuery {
  id: string;
  page: number;
  take: number;
  from?: string;
  to?: string;
}

export const getMyAppointmentsListApi = async ({
  id,
  page,
  take,
  from,
  to,
}: MyAppointmentsListPaginatedQuery) => {
  const response = await api.get(`/api/v1/appointments/list/${id}`, {
    params: {
      page,
      take,
      from,
      to,
    },
  });
  return response.data;
};

export const getPatientByAppointmentIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/patients/appointment/${id}`);
  return response.data;
};

export const getPatientTestsByAppointmentIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/patientTests/appointment/${id}`);
  return response.data;
};

export const getEvaluationOptionsApi = async (): Promise<
  EvaluationOption[]
> => {
  const response = await api.get(`/api/v1/evaluations-options`);
  return response.data;
};

export const getTestOptionsByEvaluationIdApi = async (
  evaluationId: string
): Promise<TestOption[]> => {
  const response = await api.get(`/api/v1/tests-options/${evaluationId}`);
  return response.data;
};

export const createPatientTestApi = async (payload: {
  testId: string;
  clinicalHistoryId: string;
  completedById: string;
  isGeneralDoc: boolean;
  appointmentId?: string;
  documentId?: string;
  submissionMode?: "DOCUMENT" | "FORM";
}) => {
  const response = await api.post(`/api/v1/patientTests`, payload);
  return response.data;
};

export const createPatientTestDocumentApi = async (payload: {
  name: string;
  type: DocumentType;
  filePath: string;
  userId: string;
}): Promise<Document> => {
  const response = await api.post(`/api/v1/documents`, payload);
  return response.data;
};

export const updatePatientTestDocumentFileNameApi = async (
  documentId: string,
  payload: {
    name: string;
  }
): Promise<Document> => {
  const response = await api.put(`/api/v1/documents/${documentId}`, payload);
  return response.data;
};

export const updateAppointmentStatusApi = async (
  appointmentId: string,
  payload: {
    status: AppointmentStatus;
  }
) => {
  const response = await api.put(
    `/api/v1/appointments/status/${appointmentId}`,
    payload
  );
  return response.data;
};

interface UpdatePatientTestBody {
  id: string;
  dataToUpdate: {
    isGeneralDoc?: boolean;
    documentId?: string;
  };
}
export const updatePatientTestApi = async ({
  dataToUpdate,
  id,
}: UpdatePatientTestBody) => {
  const response = await api.put(`/api/v1/patientTests/${id}`, dataToUpdate);
  return response.data;
};
