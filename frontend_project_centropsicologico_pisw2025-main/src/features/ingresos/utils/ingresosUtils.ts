export function money(n: number | string) {
  return `S/ ${Number(n || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function pad(n: number) {
  return String(n).padStart(6, "0");
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateIGV(total: number) {
  const subtotal = round2(total / 1.18);
  const igv = round2(total - subtotal);
  return { subtotal, igv, total: round2(total) };
}

export function getEmptyFilters() {
  return {
    dateFrom: "",
    dateTo: "",
    patient: "",
    client: "",
    psychologist: "",
    payment: "",
    number: "",
  };
}

export const PAYMENT_METHODS = [
  "Yape",
  "Plin",
  "Efectivo",
  "Transferencia",
  "Tarjeta",
];

export const PAYMENT_METHOD_TO_BACKEND: Record<string, string> = {
  Yape: "YAPE",
  Plin: "PLIN",
  Efectivo: "CASH",
  Transferencia: "BANK_TRANSFER",
  Tarjeta: "CARD",
};

export const BACKEND_TO_PAYMENT_METHOD: Record<string, string> = {
  YAPE: "Yape",
  PLIN: "Plin",
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};

export const ATTENTION_TYPES = ["Particular", "Social", "Convenio"];

export const ATTENTION_TO_BACKEND: Record<string, string> = {
  Particular: "PARTICULAR",
  Social: "SOCIAL",
  Convenio: "AGREEMENT",
};

export const STATUS_TO_SPANISH: Record<string, string> = {
  ISSUED: "Vigente",
  CANCELLATION_REQUESTED: "Vigente",
  CORRECTION_REQUESTED: "Vigente",
  PARTIALLY_REFUNDED: "Vigente",
  CANCELED: "Anulado",
  CORRECTED: "Corregido",
  REFUNDED: "Anulado",
};

export const CHANGE_TYPE_LABELS: Record<string, string> = {
  CANCELLATION: "Anulación",
  CORRECTION: "Corrección",
  REFUND: "Devolución",
};

export const CHANGE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};
