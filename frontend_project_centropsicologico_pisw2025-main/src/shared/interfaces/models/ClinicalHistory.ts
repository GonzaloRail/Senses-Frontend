import type { Patient } from "./Patient";
import type { PatientTest } from "./PatientTest";

export interface ClinicalHistory {
  id: string;
  displayInt: number;

  patientTests: PatientTest[];
  patient?: Patient;

  createdAt: Date;
  updatedAt: Date;
}
