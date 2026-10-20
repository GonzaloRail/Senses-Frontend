// Isolated demonstration fixtures. Do not use as a fallback for real API data.
export const DEMO_DATE = "2026-10-19";
export const DEMO_LOCATIONS = [
  { id: "central", name: "Sede Central", address: "Ubicación ilustrativa · no corresponde a una sede real" },
  { id: "norte", name: "Sede Norte", address: "Ubicación ilustrativa · no corresponde a una sede real" },
];

export const DEMO_PSYCHOLOGISTS = [
  { id: "ana", name: "Ana Salazar" },
  { id: "carlos", name: "Carlos Mendoza" },
  { id: "lucia", name: "Lucía Torres" },
  { id: "diego", name: "Diego Ramos" },
];

export interface DemoScheduleBlock {
  id: string;
  date: string;
  locationId: string;
  psychologistId: string;
  office: string;
  start: string;
  end: string;
}

export const DEMO_BLOCKS: DemoScheduleBlock[] = [
  { id: "c1", date: DEMO_DATE, locationId: "central", psychologistId: "ana", office: "Consultorio 101", start: "08:00", end: "12:00" },
  { id: "c2", date: DEMO_DATE, locationId: "central", psychologistId: "carlos", office: "Consultorio 102", start: "09:00", end: "13:00" },
  { id: "c3", date: DEMO_DATE, locationId: "central", psychologistId: "lucia", office: "Consultorio 103", start: "10:00", end: "14:00" },
  { id: "c4", date: DEMO_DATE, locationId: "central", psychologistId: "ana", office: "Consultorio 103", start: "15:00", end: "18:00" },
  { id: "c5", date: DEMO_DATE, locationId: "central", psychologistId: "diego", office: "Consultorio 101", start: "14:00", end: "19:00" },
  { id: "n1", date: DEMO_DATE, locationId: "norte", psychologistId: "carlos", office: "Consultorio 201", start: "15:00", end: "19:00" },
  { id: "n2", date: DEMO_DATE, locationId: "norte", psychologistId: "lucia", office: "Consultorio 202", start: "16:00", end: "20:00" },
  { id: "t1", date: "2026-10-20", locationId: "central", psychologistId: "diego", office: "Consultorio 102", start: "08:00", end: "12:00" },
  { id: "t2", date: "2026-10-20", locationId: "central", psychologistId: "lucia", office: "Consultorio 101", start: "14:00", end: "18:00" },
  { id: "t3", date: "2026-10-20", locationId: "norte", psychologistId: "ana", office: "Consultorio 201", start: "09:00", end: "13:00" },
];

export function filterDemoSchedule(date: string, locationId: string, psychologistId = "all") {
  return DEMO_BLOCKS.filter((block) =>
    block.date === date && block.locationId === locationId &&
    (psychologistId === "all" || block.psychologistId === psychologistId)
  ).sort((a, b) => a.start.localeCompare(b.start) || a.office.localeCompare(b.office));
}

export function summarizeDemoSchedule(blocks: DemoScheduleBlock[]) {
  return {
    psychologists: new Set(blocks.map((block) => block.psychologistId)).size,
    offices: new Set(blocks.map((block) => block.office)).size,
    blocks: blocks.length,
  };
}
