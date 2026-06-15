import api from "@/api/api";

export const getTotalPsychologists = async () => {
  const response = await api.get(`/api/v1/dashboard/psychologists`);
  return response.data;
};

export const getTotalPatients = async () => {
  const response = await api.get(`/api/v1/dashboard/patients`);
  return response.data;
};

export const getTotalHoursPerMonth = async () => {
  const response = await api.get(`/api/v1/dashboard/total-hours`);
  return response.data;
};

export const getSocialCasesPerMonth = async () => {
  const response = await api.get(`/api/v1/dashboard/social-cases-month`);
  return response.data;
};

export const getActiveInternals = async () => {
  const response = await api.get(`/api/v1/dashboard/active-internals`);
  return response.data;
};

export const getTotalSocialCases = async () => {
  const response = await api.get(`/api/v1/dashboard/social-cases`);
  return response.data;
};

export const getTotalParticularCases = async () => {
  const response = await api.get(`/api/v1/dashboard/particular-cases`);
  return response.data;
};

export const getPatientsPerAgeGroups = async () => {
  const response = await api.get(`/api/v1/dashboard/patients-age-groups`);
  return response.data;
};

export const getPsychologistsWithPatients = async () => {
  const response = await api.get(`/api/v1/dashboard/psychologists-with-patients`);
  return response.data;
};

export const getAppointmentsByWeekday = async () => {
  const response = await api.get(`/api/v1/dashboard/appointments-by-weekday`);
  return response.data;
};
