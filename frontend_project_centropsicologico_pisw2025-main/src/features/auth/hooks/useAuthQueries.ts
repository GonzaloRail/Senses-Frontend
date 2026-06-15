import type {
  ValidateResetTokenResponse,
  ValidateTokenResponse,
} from "@/shared/interfaces/apiResponses/authResponses";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  validateActivateToken,
  validateResetPasswordToken,
} from "../api/authApi";

export const useValidateActivationToken = (
  token: string | undefined,
  config?: Omit<UseQueryOptions<ValidateTokenResponse>, "queryKey" | "queryFn">
) => {
  return useQuery<ValidateTokenResponse>({
    queryKey: ["validateActivation", token],
    queryFn: () => {
      if (!token) {
        throw new Error("Token no proporcionado");
      }
      return validateActivateToken(token);
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!token,
    ...config, // Spread las opciones adicionales
  });
};

export const useValidateResetPasswordToken = (
  token: string | undefined,
  config?: Omit<
    UseQueryOptions<ValidateResetTokenResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery<ValidateResetTokenResponse>({
    queryKey: ["validateResetToken", token],
    queryFn: () => {
      if (!token) {
        throw new Error("Token no proporcionado");
      }
      return validateResetPasswordToken(token);
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!token,
    ...config, // Spread las opciones adicionales
  });
};
