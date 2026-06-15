import api from "@/api/api";

export const getAllRegionsApi = async () => {
  const response = await api.get(`/api/v1/regions`);
  return response.data;
};

export const getRegionByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/regions/${id}`);
  return response.data;
};
