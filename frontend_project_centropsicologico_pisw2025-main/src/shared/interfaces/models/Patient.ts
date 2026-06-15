import type { Appointment } from "./Appointment";
import type { ClinicalHistory } from "./ClinicalHistory";
import type { District } from "./District";
import type { User } from "./User";

export type Gender = "MALE" | "FEMALE" | "LGBTQ" | "NOT_SPECIFIED";

export type MaritalStatus = "SINGLE" | "MARRIED" | "WIDOWED" | "DIVORCED" | "COHABITANT";

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  gender: Gender;
  birthdate: Date;
  educationLevel: string;
  birthPlace: string;
  occupation: string;
  maritalStatus: MaritalStatus;
  religion?: string;
  occupationLocation: string;
  phoneNumber: string;
  isActive: boolean;
  address: string;

  parentFullName?: string;
  parentDni?: string;
  parentPhoneNumber?: string;

  districtId: string;
  district: Partial<District>;

  psychologistId?: string;
  psychologist?: User;

  clinicalHistoryId: string;
  clinicalHistory: ClinicalHistory;

  intakeInfo?: {
    livesWithText?: string | null;
    childrenCount?: number | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    mainConsultationReason?: string | null;
    situationDurationText?: string | null;
    hadPreviousTherapy?: boolean | null;
    takesPsychiatricMedication?: boolean | null;
    comparedOtherCenters?: boolean | null;
    referredByName?: string | null;
    attractionNote?: string | null;
    incomeRange?: {
      name?: string | null;
      label?: string | null;
    } | null;
    extraData?: {
      frontend?: Record<string, unknown>;
      [key: string]: unknown;
    } | null;
    selectionsByGroup?: Record<string, unknown>;
  } | null;

  livesWith?: string;
  numChildren?: string;
  guardianName?: string;
  guardianPhone?: string;
  mainReason?: string;
  howLong?: string;
  previousTherapy?: string;
  psychiatricMedication?: string;
  urgencyLevel?: string;
  preferredModality?: string;
  preferredSchedule?: string;
  requiredSpecialty?: string;
  preferredContact?: string;
  howFoundUs?: string;
  whoReferred?: string;
  whatAttractedAttention?: string;
  comparedOtherCenters?: string;
  acceptPromotions?: string;
  employmentStatus?: string;
  workSector?: string;
  workMode?: string;
  incomeRange?: string;
  paymentMethods?: string;
  acceptDataPolicy?: boolean;
  acceptCommunications?: boolean;

  appointments: Appointment[];

  createdAt: Date;
  updatedAt: Date;
}

// Minimal patient
export type PatientMinimal = Pick<
  Patient,
  "id" | "dni" | "firstName" | "lastName"
>;
