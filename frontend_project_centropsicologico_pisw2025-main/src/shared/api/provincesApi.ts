import api from "@/api/api";

export const getProvincesByRegionIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/provinces/region/${id}`);
  return response.data;
};

export const getProvinceByIdApi = async (id: string) => {
  const response = await api.get(`/api/v1/provinces/${id}`);
  return response.data;
};
