import type { ClinicalHistory } from "./ClinicalHistory";
import type { Document } from "./Document";
import type { Test } from "./Test";

export interface PatientTest {
  id: string;

  testId: string;
  test: Test;

  clinicalHistoryId: string;
  clinicalHistory: ClinicalHistory;

  document?: Document;

  isGeneralDoc: boolean;

  completedById: string;
  completedBy: {
    id?: string;
    firstName: string;
    lastName: string;
  };

  completedAt: string | Date;

  /** Cita en la que se aplicó este test (si aplica) */
  appointment?: {
    startDate: string | Date;
  } | null;

  submissionMode?: "DOCUMENT" | "FORM";
  formSubmission?: {
    id: string;
    responseData: any;
  } | null;
}
