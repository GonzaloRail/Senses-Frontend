import type { Location } from "../models";
import type { PaginatedResponse } from "./PaginatedResponse";

export interface PsychologistScheduleListPaginatedResponse extends PaginatedResponse {
  psychologists: PsychologistScheduleListItem[];
}

export interface PsychologistScheduleListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface OfficeScheduleListPaginatedResponse extends PaginatedResponse {
  offices: OfficeScheduleListItem[];
}

export interface OfficeScheduleListItem {
  id: string;
  name: string;
  type: string;
  location: Location;
  isActive: boolean;
}