import api from "@/api/api";

export interface DashboardFilters {
  from?: string;
  to?: string;
  psychologistId?: string;
  officeId?: string;
}

const getDashboard = (path: string, filters?: DashboardFilters) =>
  api.get(path, { params: filters });

export const getTotalPsychologists = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/psychologists`, filters);
  return response.data;
};

export const getTotalPatients = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/patients`, filters);
  return response.data;
};

export const getTotalHoursPerMonth = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/total-hours`, filters);
  return response.data;
};

export const getSocialCasesPerMonth = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/social-cases-month`, filters);
  return response.data;
};

export const getActiveInternals = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/active-internals`, filters);
  return response.data;
};

export const getTotalSocialCases = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/social-cases`, filters);
  return response.data;
};

export const getTotalParticularCases = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/particular-cases`, filters);
  return response.data;
};

export const getPatientsPerAgeGroups = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/patients-age-groups`, filters);
  return response.data;
};

export const getPsychologistsWithPatients = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/psychologists-with-patients`, filters);
  return response.data;
};

export const getAppointmentsByWeekday = async (filters?: DashboardFilters) => {
  const response = await getDashboard(`/api/v1/dashboard/appointments-by-weekday`, filters);
  return response.data;
};
