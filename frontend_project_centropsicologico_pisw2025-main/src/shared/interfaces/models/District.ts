import type { Location } from "./Location";
import type { Patient } from "./Patient";
import type { Province } from "./Province";

export interface District {
  id: string;
  name: string;

  provinceId: string;
  province: Partial<Province>;

  locations: Location[];

  patients: Patient[];

  createdAt: Date;
  updatedAt: Date;
}
