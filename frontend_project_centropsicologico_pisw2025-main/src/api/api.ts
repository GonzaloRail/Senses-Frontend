import axios from "axios";

import { getAuth, setAuth } from "@/store/auth/auth.store";
import { queryClient } from "@/lib/queryClient";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  // baseURL: "http://localhost:5000",
  // baseURL: "https://senses-app-backend-324428736826.us-east1.run.app",
  baseURL: "https://senses-backend-n8x5.onrender.com",
  withCredentials: true, // para enviar cookies
});

api.interceptors.request.use((config) => {
  const token = getAuth().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// TODO: Review this interceptor for refresh token

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    console.log("interceptor response", error);
    const originalRequest = error.config;

    const isLoginOrRefresh =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginOrRefresh
    ) {
      originalRequest._retry = true;
      try {
        const res = await api.post("/auth/refresh-token");
        setAuth({
          accessToken: res.data.accessToken,
          roleSelected: res.data.roleSelected,
        });
        console.log("desdeAPI", res.data);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
      } catch (error) {
        setAuth({ accessToken: null, user: null });
        queryClient.clear();
        console.log(error);
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
