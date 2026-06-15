import type { EmployeeLeave } from "./EmployeeLeave";
import type { PatientTest } from "./PatientTest";
import type { Test } from "./Test";
import type { User } from "./User";

export type DocumentType =
  | "CLINICAL_HISTORY"
  | "USER_DOCS"
  | "TEMPLATE"
  | "EVALUATION_TEST";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string; // this now is optional in backend, but it will be returned always when we get a document from backend

  userId?: string;
  user?: User;

  testId?: string;
  test?: Test;
  bucketName?: string;
  filePath?: string;

  patientTestId?: string;
  patientTest?: PatientTest;

  employeeLeaveId?: string;
  employeeLeave?: EmployeeLeave;

  createdAt: Date;
  updatedAt: Date;
}
