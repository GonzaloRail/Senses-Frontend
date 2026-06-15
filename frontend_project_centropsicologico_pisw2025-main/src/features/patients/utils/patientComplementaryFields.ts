import type { Patient } from "@/shared/interfaces/models";
import type { PatientFormSchema } from "@/shared/interfaces/forms/PatientFormSchema";

export const complementaryFields: (keyof PatientFormSchema)[] = [
  "livesWith",
  "numChildren",
  "guardianName",
  "guardianPhone",
  "mainReason",
  "howLong",
  "previousTherapy",
  "psychiatricMedication",
  "urgencyLevel",
  "preferredModality",
  "preferredSchedule",
  "requiredSpecialty",
  "preferredContact",
  "howFoundUs",
  "whoReferred",
  "whatAttractedAttention",
  "comparedOtherCenters",
  "acceptPromotions",
  "employmentStatus",
  "workSector",
  "workMode",
  "incomeRange",
  "paymentMethods",
  "acceptDataPolicy",
  "acceptCommunications",
];

export const defaultComplementaryValues = {
  livesWith: "",
  numChildren: "",
  guardianName: "",
  guardianPhone: "",
  mainReason: "",
  howLong: "",
  previousTherapy: "",
  psychiatricMedication: "",
  urgencyLevel: "",
  preferredModality: "",
  preferredSchedule: "",
  requiredSpecialty: "",
  preferredContact: "",
  howFoundUs: "",
  whoReferred: "",
  whatAttractedAttention: "",
  comparedOtherCenters: "",
  acceptPromotions: "",
  employmentStatus: "",
  workSector: "",
  workMode: "",
  incomeRange: "",
  paymentMethods: "",
  acceptDataPolicy: false,
  acceptCommunications: false,
};

export const complementaryExportColumns = [
  { key: "livesWith", label: "¿Con quién vive actualmente?" },
  { key: "numChildren", label: "Número de hijos" },
  { key: "guardianName", label: "Nombre del apoderado, si aplica" },
  { key: "guardianPhone", label: "Teléfono del apoderado, si aplica" },
  { key: "mainReason", label: "Motivo principal de consulta" },
  { key: "howLong", label: "¿Hace cuánto presenta esta situación?" },
  { key: "previousTherapy", label: "¿Ha llevado terapia anteriormente?" },
  {
    key: "psychiatricMedication",
    label: "¿Actualmente toma medicación psiquiátrica?",
  },
  { key: "urgencyLevel", label: "Nivel de urgencia" },
  { key: "preferredModality", label: "Modalidad preferida" },
  { key: "preferredSchedule", label: "Horarios preferidos" },
  { key: "requiredSpecialty", label: "Especialidades requeridas" },
  { key: "preferredContact", label: "Contacto preferido" },
  { key: "howFoundUs", label: "¿Cómo nos encontró?" },
  { key: "whoReferred", label: "¿Quién le recomendó el servicio?" },
  {
    key: "whatAttractedAttention",
    label: "¿Qué fue lo que más le llamó la atención?",
  },
  {
    key: "comparedOtherCenters",
    label: "¿Comparó otros centros antes de elegirnos?",
  },
  {
    key: "acceptPromotions",
    label: "¿Acepta recibir contenido psicológico y promociones?",
  },
  { key: "employmentStatus", label: "Situación laboral" },
  { key: "workSector", label: "Sector laboral / rubro" },
  { key: "workMode", label: "¿Trabaja remoto, presencial o mixto?" },
  { key: "incomeRange", label: "Rango aproximado de ingresos" },
  { key: "paymentMethods", label: "Métodos de pago" },
  {
    key: "acceptDataPolicy",
    label: "Acepta tratamiento de datos personales",
  },
  { key: "acceptCommunications", label: "Acepta comunicaciones" },
] as const;

const booleanToYesNo = (value: unknown) => {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return typeof value === "string" ? value : "";
};

const readFrontendExtra = (patient?: Partial<Patient>) => {
  const intakeInfo = patient?.intakeInfo;
  const extraData = intakeInfo?.extraData;
  return extraData && typeof extraData.frontend === "object" && extraData.frontend
    ? extraData.frontend
    : {};
};

const readValue = (
  patient: Partial<Patient> | undefined,
  field: keyof PatientFormSchema,
  fallback?: unknown
) => {
  const frontendExtra = readFrontendExtra(patient);
  const directValue = patient?.[field as keyof Patient];
  const extraValue = frontendExtra[field];
  return directValue ?? extraValue ?? fallback;
};

export const extractComplementaryFormValues = (patient?: Partial<Patient>) => {
  const intakeInfo = patient?.intakeInfo;

  return {
    livesWith: String(readValue(patient, "livesWith", intakeInfo?.livesWithText) ?? ""),
    numChildren: String(readValue(patient, "numChildren", intakeInfo?.childrenCount) ?? ""),
    guardianName: String(readValue(patient, "guardianName", intakeInfo?.guardianName) ?? ""),
    guardianPhone: String(readValue(patient, "guardianPhone", intakeInfo?.guardianPhone) ?? ""),
    mainReason: String(
      readValue(patient, "mainReason", intakeInfo?.mainConsultationReason) ?? ""
    ),
    howLong: String(readValue(patient, "howLong", intakeInfo?.situationDurationText) ?? ""),
    previousTherapy: booleanToYesNo(
      readValue(patient, "previousTherapy", intakeInfo?.hadPreviousTherapy)
    ),
    psychiatricMedication: booleanToYesNo(
      readValue(
        patient,
        "psychiatricMedication",
        intakeInfo?.takesPsychiatricMedication
      )
    ),
    urgencyLevel: String(readValue(patient, "urgencyLevel") ?? ""),
    preferredModality: String(readValue(patient, "preferredModality") ?? ""),
    preferredSchedule: String(readValue(patient, "preferredSchedule") ?? ""),
    requiredSpecialty: String(readValue(patient, "requiredSpecialty") ?? ""),
    preferredContact: String(readValue(patient, "preferredContact") ?? ""),
    howFoundUs: String(readValue(patient, "howFoundUs") ?? ""),
    whoReferred: String(readValue(patient, "whoReferred", intakeInfo?.referredByName) ?? ""),
    whatAttractedAttention: String(
      readValue(patient, "whatAttractedAttention", intakeInfo?.attractionNote) ?? ""
    ),
    comparedOtherCenters: booleanToYesNo(
      readValue(patient, "comparedOtherCenters", intakeInfo?.comparedOtherCenters)
    ),
    acceptPromotions: booleanToYesNo(readValue(patient, "acceptPromotions")),
    employmentStatus: String(readValue(patient, "employmentStatus") ?? ""),
    workSector: String(readValue(patient, "workSector") ?? ""),
    workMode: String(readValue(patient, "workMode") ?? ""),
    incomeRange: String(
      readValue(patient, "incomeRange", intakeInfo?.incomeRange?.label ?? intakeInfo?.incomeRange?.name) ?? ""
    ),
    paymentMethods: String(readValue(patient, "paymentMethods") ?? ""),
    acceptDataPolicy: Boolean(readValue(patient, "acceptDataPolicy", false)),
    acceptCommunications: Boolean(readValue(patient, "acceptCommunications", false)),
  };
};
