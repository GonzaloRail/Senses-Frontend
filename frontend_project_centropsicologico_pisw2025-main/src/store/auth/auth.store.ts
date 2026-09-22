// import type { UserResponse } from "@/shared/interfaces/apiResponses/userResponse";
import type { Role, User } from "@/shared/interfaces/models";
import { create } from "zustand";

interface AuthState {
  roleSelected: Role["name"] | null;
  previewRole: Role["name"] | null;
  roleBeforePreview: Role["name"] | null;
  accessToken: string | null;
  user: User | null;
  setAuth: (data: Partial<AuthState>) => void;
  setRolePreview: (role: Role["name"]) => void;
  clearRolePreview: () => void;
  clearAuth: () => void;
  isAuthBootstrapped: boolean;
}

export const useAuth = create<AuthState>((set) => ({
  roleSelected: null,
  previewRole: null,
  roleBeforePreview: null,
  accessToken: null,
  user: null,
  isAuthBootstrapped: false,
  setAuth: (data) =>
    set((state) => ({ ...state, ...data, isAuthBootstrapped: true })),
  setRolePreview: (role) =>
    set((state) => ({
      roleSelected: role,
      previewRole: role,
      roleBeforePreview: state.roleBeforePreview ?? state.roleSelected,
    })),
  clearRolePreview: () =>
    set((state) => ({
      roleSelected: state.roleBeforePreview,
      previewRole: null,
      roleBeforePreview: null,
    })),
  clearAuth: () =>
    set({
      roleSelected: null,
      previewRole: null,
      roleBeforePreview: null,
      accessToken: null,
      user: null,
      isAuthBootstrapped: true,
    }),
}));

export const getAuth = () => useAuth.getState();
export const setAuth = (data: Partial<AuthState>) =>
  useAuth.getState().setAuth(data);
export const clearAuth = () => useAuth.getState().clearAuth();
