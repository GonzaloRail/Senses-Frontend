import type { Test } from "./Test";
import type { User } from "./User";

export interface Evaluation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdById: string;
  createdBy: User;
  tests: Test[];
  openNewSection: boolean;
  sectionOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateEvaluationPayload {
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateEvaluationPayload {
  name: string;
  description: string | undefined;
  createdById: string;
  openNewSection: boolean;
}

export interface Section {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
  evaluations: Evaluation[];
}

export interface SectionToDoSort {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
  evaluationCount: number;
}

export const EvaluationDefaultID = "DEFAULT_ID";

export interface AppointmentEvaluations {
  id: string;
  name: string;
  tests: AppointmentTest[];
}

export interface AppointmentTest {
  id: string;
  testId: string;
  name: string;
  documentId?: string;
  templateUrl: string;
  uploadedFileName?: string;
  uploadedFileUrl?: string;
  uploadedFile?: File;
  submissionMode?: "DOCUMENT" | "FORM";
  formTemplate?: {
    id: string;
    name: string;
    fieldsSchema: any;
  } | null;
  formSubmission?: {
    id: string;
    responseData: any;
  } | null;
}

export interface EvaluationOption {
  id: string;
  name: string;
}
