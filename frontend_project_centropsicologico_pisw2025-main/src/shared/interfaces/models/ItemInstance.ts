import type { Item } from "./Item";
import type { Office } from "./Office";

export interface ItemInstance {
  id: string;
  displayInt: number;

  officeId?: string;
  office?: Office;

  itemId: string;
  item: Item;

  createdAt: Date;
  updatedAt: Date;
}
