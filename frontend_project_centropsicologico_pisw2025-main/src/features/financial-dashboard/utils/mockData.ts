import type { MockReceipt, MockExpense, PsychologistConfig } from "@/shared/interfaces/models/Financial";

export const PSYCHOLOGISTS: PsychologistConfig[] = [
  { name: "Psicólogo Demo 1", commission: 0.50 },
  { name: "Psicóloga Demo 2", commission: 0.50 },
  { name: "Interno Demo", commission: 0.40 },
];

export const PAYMENT_METHODS = ["Yape", "Plin", "Efectivo", "Transferencia", "Tarjeta"];

export const EXPENSE_TYPES = ["Fijo", "Variable", "Activo"];

export const MOCK_RECEIPTS: MockReceipt[] = [
  { id: 1, date: "2026-06-03", client: "Cliente Demo A", patient: "Paciente Demo A", service: "Consulta", psychologist: "Psicólogo Demo 1", payment: "Yape", total: 150, status: "Vigente" },
  { id: 2, date: "2026-06-05", client: "Cliente Demo B", patient: "Paciente Demo B", service: "Evaluación psicológica", psychologist: "Psicóloga Demo 2", payment: "Transferencia", total: 280, status: "Vigente" },
  { id: 3, date: "2026-06-12", client: "Cliente Demo C", patient: "Paciente Demo C", service: "Terapia individual", psychologist: "Interno Demo", payment: "Efectivo", total: 90, status: "Vigente" },
  { id: 4, date: "2026-06-17", client: "Cliente Demo D", patient: "Paciente Demo D", service: "Neuropsicología", psychologist: "Psicólogo Demo 1", payment: "Tarjeta", total: 320, status: "Vigente" },
  { id: 5, date: "2026-06-21", client: "Cliente Demo E", patient: "Paciente Demo E", service: "Terapia individual", psychologist: "Psicóloga Demo 2", payment: "Plin", total: 130, status: "Vigente" },
  { id: 6, date: "2026-06-15", client: "Cliente Demo F", patient: "Paciente Demo F", service: "Consulta", psychologist: "Psicólogo Demo 1", payment: "Yape", total: 100, status: "Anulado" },
];

export const MOCK_EXPENSES: MockExpense[] = [
  { id: 1, date: "2026-06-04", type: "Fijo", concept: "Alquiler de consultorio", provider: "Proveedor A", payment: "Transferencia", amount: 650, status: "Aprobado", area: "Servicios" },
  { id: 2, date: "2026-06-08", type: "Variable", concept: "Material de oficina", provider: "Proveedor B", payment: "Efectivo", amount: 85, status: "Aprobado", area: "Materiales" },
  { id: 3, date: "2026-06-20", type: "Variable", concept: "Publicidad en redes", provider: "Proveedor C", payment: "Tarjeta", amount: 120, status: "Pendiente", area: "Otros" },
  { id: 4, date: "2026-06-23", type: "Activo", concept: "Silla para consultorio", provider: "Proveedor D", payment: "Yape", amount: 210, status: "Pendiente", area: "Materiales" },
];

export const OPENING_BALANCE = 500;
