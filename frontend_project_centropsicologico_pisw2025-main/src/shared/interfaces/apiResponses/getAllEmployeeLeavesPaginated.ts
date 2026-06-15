import type { PaginatedResponse } from "./PaginatedResponse";

export interface EmployeeLeavesPaginatedResponse extends PaginatedResponse {
  employeeLeaves: EmployeeLeaveForTable[];
}

interface EmployeeLeaveForTable {
  id: string;
  psychologistName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
