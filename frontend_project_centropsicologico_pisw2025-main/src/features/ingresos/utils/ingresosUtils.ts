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

export const PSYCHOLOGISTS = [
  "Psicólogo Demo 1",
  "Psicóloga Demo 2",
  "Interno Demo",
];

export const PAYMENT_METHODS = [
  "Yape",
  "Plin",
  "Efectivo",
  "Transferencia",
  "Tarjeta",
];

export const SERVICES = [
  "Consulta",
  "Evaluación psicológica",
  "Terapia individual",
  "Neuropsicología",
  "Otro",
];

export const ATTENTION_TYPES = ["Particular", "Social", "Convenio"];
