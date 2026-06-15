import type { District } from "./District";
import type { Office } from "./Office";

export interface Location {
  id: string;
  name: string;
  isActive: boolean;
  address: string;

  districtId: string;
  district: District;

  offices: Office[];

  createdAt: Date;
  updatedAt: Date;
}

export type LocationMinimal = Pick<
  Location,
  "id" | "name"
>;

