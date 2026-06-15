import type { UserMinimal } from "../models";

export interface GetEmployeeLeaveByIdResponse {
  id: string;
  startDate: string; // ISO string UTC
  endDate: string; // ISO string UTC
  reason?: string;
  isActive: boolean;
  user: UserMinimal;
}
