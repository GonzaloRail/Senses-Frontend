import api from "@/api/api";

export const getDistrictsByProvinceIdApi = async (id: string) => {
  if (!id) {
    return [];
  }
  const response = await api.get(`/api/v1/districts/province/${id}`);
  return response.data;
};
