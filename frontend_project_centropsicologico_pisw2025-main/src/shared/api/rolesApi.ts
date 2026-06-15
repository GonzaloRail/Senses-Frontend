import api from "@/api/api";

export const getAllRolesApi = async () => {
  const response = await api.get("/api/v1/roles");
  return response.data;
};
