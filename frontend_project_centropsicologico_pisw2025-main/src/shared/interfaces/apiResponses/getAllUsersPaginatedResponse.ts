import type { User } from "../models";

export interface UsersPaginatedResponse {
  currentPage: number;
  totalPages: number;
  users: User[];
}

export type RoleName = "INTERNAL" | "PSYCHOLOGIST" | "ADMIN" | "ADMISSION";
