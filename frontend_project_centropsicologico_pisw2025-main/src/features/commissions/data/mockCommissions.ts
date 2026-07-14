export interface MockPsychologist {
  id: string;
  name: string;
  commissionPercentage: number;
}

export interface MockReceipt {
  id: string;
  date: string;
  patientName: string;
  service: string;
  amount: number;
  status: "PAID" | "ANNULLED";
  psychologistId: string;
}

export const mockPsychologists: MockPsychologist[] = [
  { id: "psy_1", name: "Dra. Ana López", commissionPercentage: 50 },
  { id: "psy_2", name: "Dr. Carlos Ruiz", commissionPercentage: 60 },
  { id: "psy_3", name: "Lic. María Gómez", commissionPercentage: 50 },
];

export const mockReceipts: MockReceipt[] = [
  {
    id: "REC-2026-0001",
    date: new Date().toISOString(), // Hoy
    patientName: "Juan Pérez",
    service: "Terapia Individual",
    amount: 100,
    status: "PAID",
    psychologistId: "psy_1",
  },
  {
    id: "REC-2026-0002",
    date: new Date(Date.now() - 86400000).toISOString(), // Ayer
    patientName: "Lucía Fernández",
    service: "Terapia de Pareja",
    amount: 150,
    status: "PAID",
    psychologistId: "psy_1",
  },
  {
    id: "REC-2026-0003",
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // Hace 2 días
    patientName: "Marcos Díaz",
    service: "Evaluación Psicológica",
    amount: 200,
    status: "ANNULLED",
    psychologistId: "psy_1",
  },
  {
    id: "REC-2026-0004",
    date: new Date(Date.now() - 86400000 * 3).toISOString(), // Hace 3 días
    patientName: "Elena Vargas",
    service: "Terapia Infantil",
    amount: 120,
    status: "PAID",
    psychologistId: "psy_2",
  },
  {
    id: "REC-2026-0005",
    date: new Date(Date.now() - 86400000 * 4).toISOString(), // Hace 4 días
    patientName: "Roberto Sánchez",
    service: "Terapia Individual",
    amount: 100,
    status: "PAID",
    psychologistId: "psy_3",
  },
];
