import type { Province } from "./Province";

export interface Region {
  id: string;
  name: string;

  provinces: Province[];

  createdAt: Date;
  updatedAt: Date;
}
