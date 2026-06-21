import type { Document } from "./Document";
import type { Evaluation } from "./Evaluation";
import type { PatientTest } from "./PatientTest";
import type { User } from "./User";

export interface Test {
  id: string;
  name: string;
  description?: string;
  document?: Document;
  isActive?: boolean;
  testGroupId?: string;

  createdById: string;
  createdBy: User;

  evaluationId: string;
  evaluation: Evaluation;

  patientTests: PatientTest[];

  createdAt: Date;
  updatedAt: Date;
  formTemplate?: {
    id: string;
    name: string;
    fieldsSchema: any[];
  } | null;
}

export interface CreateTestPayload {
  name: string;
  description?: string;
  evaluationId: string;
  createdById?: string;
  filename: string;
  filePath: string;
}

export interface TestOption {
  id: string;
  name: string;
  document?: {
    fileUrl: string;
  } | null;
}
