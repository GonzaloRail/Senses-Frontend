import type { Office } from "./Office";
import type { User } from "./User";

type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface WorkSchedule {
  id: string;
  day: WeekDay;
  startTime: string; // ISO 8601 time format (e.g., "08:00:00")
  endTime: string; // ISO 8601 time format (e.g., "17:00:00")

  userId: string;
  user: User;

  officeId: string;
  office: Office;

  createdAt: Date;
  updatedAt: Date;
}
