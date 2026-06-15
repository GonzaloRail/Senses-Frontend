import type { Item } from "../models";

export interface ItemsPaginatedResponse {
  currentPage: number;
  totalPages: number;
  items: Item[];
}