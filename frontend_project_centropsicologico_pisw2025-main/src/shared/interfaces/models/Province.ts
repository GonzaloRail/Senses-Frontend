import type { District } from "./District";
import type { Region } from "./Region";

export interface Province {
  id: string;
  name: string;

  regionId: string;
  region: Partial<Region>;

  districts: District[];

  createdAt: Date;
  updatedAt: Date;
}
