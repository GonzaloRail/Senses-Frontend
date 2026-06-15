import { useMutation } from "@tanstack/react-query";
import { clearAuth, setAuth } from "@/store/auth/auth.store";
import {
  activateAccountApi,
  loginApi,
  logoutApi,
  requestResetPasswordApi,
  resetPasswordApi,
  selectRoleAndLocationApi,
} from "../api/authApi";

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setAuth({
        accessToken: data.token,
        user: data.user,
      });
    },
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAuth();
    },
  });
};

export const useSelectRoleAndLocationMutation = () => {
  return useMutation({
    mutationFn: selectRoleAndLocationApi,
    onSuccess: (data) => {
      console.log("useRoleMutation", data);
      setAuth({
        accessToken: data.accessToken,
        roleSelected: data.roleSelected,
      });
    },
  });
};

export const useActivateAccountMutation = () => {
  return useMutation({
    mutationFn: activateAccountApi,
  });
};

export const useRequestResetPasswordMutation = () => {
  return useMutation({
    mutationFn: requestResetPasswordApi,
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: resetPasswordApi,
  });
};
