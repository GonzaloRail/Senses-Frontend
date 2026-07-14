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
    id: "REC-2023-0001",
    date: "2023-10-15T10:00:00Z",
    patientName: "Juan Pérez",
    service: "Terapia Individual",
    amount: 100,
    status: "PAID",
    psychologistId: "psy_1",
  },
  {
    id: "REC-2023-0002",
    date: "2023-10-15T11:00:00Z",
    patientName: "Lucía Fernández",
    service: "Terapia de Pareja",
    amount: 150,
    status: "PAID",
    psychologistId: "psy_1",
  },
  {
    id: "REC-2023-0003",
    date: "2023-10-16T15:00:00Z",
    patientName: "Marcos Díaz",
    service: "Evaluación Psicológica",
    amount: 200,
    status: "ANNULLED",
    psychologistId: "psy_1",
  },
  {
    id: "REC-2023-0004",
    date: "2023-10-17T09:00:00Z",
    patientName: "Elena Vargas",
    service: "Terapia Infantil",
    amount: 120,
    status: "PAID",
    psychologistId: "psy_2",
  },
  {
    id: "REC-2023-0005",
    date: "2023-10-18T14:30:00Z",
    patientName: "Roberto Sánchez",
    service: "Terapia Individual",
    amount: 100,
    status: "PAID",
    psychologistId: "psy_3",
  },
];
