import type { Appointment } from "./Appointment";
import type { ItemInstance } from "./ItemInstance";
import type { Location } from "./Location";
import type { WorkSchedule } from "./WorkSchedule";

export interface Office {
  id: string;
  name: string;
  type: string;
  capacity: number;
  isActive: boolean;

  locationId: string;
  location: Location;

  appointments: Appointment[];

  itemInstances: ItemInstance[];

  workShedules: WorkSchedule[];

  createdAt: Date;
  updatedAt: Date;
}

export type MinimalOffice = Pick<Office, "id" | "name" | "location">;
