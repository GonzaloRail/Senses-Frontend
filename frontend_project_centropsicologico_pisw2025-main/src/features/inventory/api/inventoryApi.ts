import api from "@/api/api";
import { z } from "zod";

// --- Types ---

export type InventorySituation = "OPERATIVE" | "MAINTENANCE" | "DECOMMISSIONED";

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  invoiceNumber?: string;
  name: string;
  dimensions?: string;
  description?: string;
  brand?: string;
  model?: string;
  color?: string;
  serialNumber?: string;
  quantity: number;
  imageUrl?: string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  situation: InventorySituation;
  isActive: boolean;
  categoryId: string;
  category?: InventoryCategory;
  createdAt: string;
}

export interface InventoryItemHistory {
  id: string;
  inventoryItemId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

// --- Schemas (for optional frontend validation if needed) ---
export const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});
export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;

export const createInventoryItemSchema = z.object({
  invoiceNumber: z.string().optional(),
  name: z.string().min(1, "La denominación es requerida"),
  dimensions: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  serialNumber: z.string().optional(),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  imageUrl: z.string().optional(),
  unitPrice: z.number().nonnegative("El precio no puede ser negativo").optional(),
  situation: z.enum(["OPERATIVE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
  categoryId: z.string().min(1, "La categoría es requerida"),
});
export type CreateInventoryItemPayload = z.infer<typeof createInventoryItemSchema>;

export type UpdateInventoryItemPayload = Partial<CreateInventoryItemPayload>;

// --- API Functions ---

// Categories
export const getCategories = async (): Promise<InventoryCategory[]> => {
  const { data } = await api.get<InventoryCategory[]>("/api/v1/inventory/categories");
  return data;
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<InventoryCategory> => {
  const { data } = await api.post<InventoryCategory>("/api/v1/inventory/categories", payload);
  return data;
};

// Inventory Items
export const getInventoryItems = async (params?: any): Promise<InventoryItem[]> => {
  const { data } = await api.get<{items: InventoryItem[]}>("/api/v1/inventory/items", { params });
  return data.items || [];
};

export const getInactiveInventoryItems = async (params?: any): Promise<InventoryItem[]> => {
  const { data } = await api.get<{items: InventoryItem[]}>("/api/v1/inventory/items/inactive", { params });
  return data.items || [];
};

export const getInventoryItemById = async (id: string): Promise<InventoryItem> => {
  const { data } = await api.get<InventoryItem>(`/api/v1/inventory/items/${id}`);
  return data;
};

export const createInventoryItem = async (payload: CreateInventoryItemPayload): Promise<InventoryItem> => {
  const { data } = await api.post<InventoryItem>("/api/v1/inventory/items", payload);
  return data;
};

export const updateInventoryItem = async (id: string, payload: UpdateInventoryItemPayload): Promise<InventoryItem> => {
  const { data } = await api.put<InventoryItem>(`/api/v1/inventory/items/${id}`, payload);
  return data;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/inventory/items/${id}`);
};

export const reactivateInventoryItem = async (id: string): Promise<void> => {
  await api.put(`/api/v1/inventory/items/${id}/reactivate`);
};

// History
export const getInventoryItemHistory = async (id: string): Promise<InventoryItemHistory[]> => {
  const { data } = await api.get<InventoryItemHistory[]>(`/api/v1/inventory/items/${id}/history`);
  return data;
};

// Image Upload
export const uploadInventoryImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post<{ url: string }>("/api/v1/inventory/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
