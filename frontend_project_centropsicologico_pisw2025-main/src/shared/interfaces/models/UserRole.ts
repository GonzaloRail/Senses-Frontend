import type { Role } from "./Role";
import type { User } from "./User";

export interface UserRole {
  userId: string;
  user: User;

  roleId: string;
  role: Role;
}
