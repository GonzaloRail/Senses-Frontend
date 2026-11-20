// import type { UserResponse } from "@/shared/interfaces/apiResponses/userResponse";
import type { Role, User } from "@/shared/interfaces/models";
import { create } from "zustand";
import { useNotifications } from "../notifications/notifications.store";

interface AuthState {
  roleSelected: Role["name"] | null;
  accessToken: string | null;
  user: User | null;
  setAuth: (data: Partial<AuthState>) => void;
  clearAuth: () => void;
  isAuthBootstrapped: boolean;
}

export const useAuth = create<AuthState>((set) => ({
  roleSelected: null,
  accessToken: null,
  user: null,
  isAuthBootstrapped: false,
  setAuth: (data) => {
    set((state) => ({ ...state, ...data, isAuthBootstrapped: true }));
    const { accessToken, user } = useAuth.getState();
    if (accessToken && user?.id) {
      void useNotifications.getState().initSession(accessToken, user.id);
    } else {
      useNotifications.getState().clearSession();
    }
  },
  clearAuth: () => {
    useNotifications.getState().clearSession();
    set({
      roleSelected: null,
      accessToken: null,
      user: null,
      isAuthBootstrapped: true,
    });
  },
}));

export const getAuth = () => useAuth.getState();
export const setAuth = (data: Partial<AuthState>) =>
  useAuth.getState().setAuth(data);
export const clearAuth = () => useAuth.getState().clearAuth();
