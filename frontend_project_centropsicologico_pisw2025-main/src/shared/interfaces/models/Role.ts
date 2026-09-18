import type { UserRole } from "./UserRole";

export type RoleType = "ADMIN" | "ADMISSION" | "PSYCHOLOGIST" | "INTERNAL" | "AUDITOR" | "HR";

export interface Role {
  id: string;
  name: RoleType;
  users?: UserRole[];
}