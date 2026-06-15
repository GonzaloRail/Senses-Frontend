import api from "@/api/api";

export interface FormSubmissionPayload {
  formTemplateId: string;
  responseData: Record<string, any>;
  completedById: string;
  patientTestId?: string;
}

export interface UpdateFormSubmissionPayload {
  responseData: Record<string, any>;
  patientTestId?: string;
}

export const createFormSubmissionApi = async (payload: FormSubmissionPayload) => {
  const response = await api.post(`/api/v1/form-submissions`, payload);
  return response.data;
};

export const updateFormSubmissionApi = async (id: string, payload: UpdateFormSubmissionPayload) => {
  const response = await api.put(`/api/v1/form-submissions/${id}`, payload);
  return response.data;
};

export const getFormSubmissionByPatientTestIdApi = async (patientTestId: string) => {
  const response = await api.get(`/api/v1/form-submissions/patient-test/${patientTestId}`);
  return response.data;
};
