import type { Appointment } from "./Appointment";
import type { Document } from "./Document";
import type { EmployeeLeave } from "./EmployeeLeave";
import type { Evaluation } from "./Evaluation";
import type { Patient } from "./Patient";
import type { PatientTest } from "./PatientTest";
import type { Test } from "./Test";
import type { UserRole } from "./UserRole";
import type { WorkSchedule } from "./WorkSchedule";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  password: string;
  csp?: string;
  isActive: boolean;

  psychologistId?: string;
  psychologist?: User;

  interns: User[];
  roles: UserRole[];
  patients: Patient[];
  workSchedule: WorkSchedule[];
  documents: Document[];
  appointments: Appointment[];
  employeeLeaves: EmployeeLeave[];
  createdTests: Test[];
  evaluations: Evaluation[];
  patientTests: PatientTest[];

  createdAt: Date;
  updatedAt: Date;
}

export type UserMinimal = Pick<User, "id" | "firstName" | "lastName" | "dni"> & Partial<Pick<User, "roles" | "workSchedule">>;
