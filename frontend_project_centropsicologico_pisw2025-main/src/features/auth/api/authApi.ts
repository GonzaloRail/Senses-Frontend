import api from "@/api/api";
import axios from "axios";
import { API_BASE_URL } from "@/api/api";
import type { RequestPasswordResetForm } from "@/shared/interfaces/apiResponses/authResponses";

// Google callbacks must not pass through the shared 401 refresh interceptor.
const googleAuthApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

interface LoginBody {
  email: string;
  password: string;
}

export const loginApi = async (data: LoginBody) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const requestGoogleLoginNonce = async () => {
  const response = await googleAuthApi.post<{ nonce: string }>("/auth/google/nonce", {});
  return response.data.nonce;
};

export const googleLoginApi = async (credential: string) => {
  const response = await googleAuthApi.post("/auth/google", { credential });
  return response.data;
};

export const logoutApi = async () => await api.post("/auth/logout");

interface RoleAndLocationBody {
  roleId: string;
}

export const selectRoleAndLocationApi = async (data: RoleAndLocationBody) => {
  const response = await api.post("/auth/select-role-location", data);
  return response.data;
};

export const validateActivateToken = async (token: string) => {
  const response = await api.get(`/auth/validate-activation/${token}`);
  return response.data;
};

interface ActivateAccountBody {
  token: string;
  password: string;
}
export const activateAccountApi = async ({
  token,
  password,
}: ActivateAccountBody) => {
  const response = await api.post(`/auth/activate-account`, {
    token,
    password,
  });
  return response.data;
};

export const requestResetPasswordApi = async (
  data: RequestPasswordResetForm
) => {
  const response = await api.post(`/auth/request-password-reset`, data);
  return response.data;
};

export const validateResetPasswordToken = async (token: string) => {
  const response = await api.get(`/auth/validate-reset-token/${token}`);
  return response.data;
};

interface ResetPasswordBody {
  token: string;
  password: string;
}

export const resetPasswordApi = async ({
  token,
  password,
}: ResetPasswordBody) => {
  const response = await api.post(`/auth/reset-password`, {
    token,
    password,
  });
  return response.data;
};
