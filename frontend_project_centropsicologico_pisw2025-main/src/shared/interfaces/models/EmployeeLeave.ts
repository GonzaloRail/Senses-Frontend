import type { Document } from "./Document";
import type { User } from "./User";

export interface EmployeeLeave {
  id: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  isActive: boolean;

  document?: Document;

  userId: string;
  user: User;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeLeavePayload {
  userId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export type UpdateEmployeeLeavePayload = Omit<
  CreateEmployeeLeavePayload,
  "userId"
>;
