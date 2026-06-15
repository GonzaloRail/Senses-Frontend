import type { Location } from "../models";

export interface LocationsPaginatedResponse {
  currentPage: number;
  totalPages: number;
  locations: Location[];
}
