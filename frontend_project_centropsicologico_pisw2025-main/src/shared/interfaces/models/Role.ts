import type { UserRole } from "./UserRole";

export type RoleType = "ADMIN" | "ADMISSION" | "PSYCHOLOGIST" | "INTERNAL";

export interface Role {
  id: string;
  name: RoleType;
  users?: UserRole[];
}