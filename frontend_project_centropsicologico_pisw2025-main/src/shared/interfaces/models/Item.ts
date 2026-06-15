import type { ItemInstance } from "./ItemInstance";

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  isActive: boolean;

  items: ItemInstance[];

  createdAt: Date;
  updatedAt: Date;
}

export type ItemMinimal = Pick<
  Item,
  "id" | "name" | "items"
>;

