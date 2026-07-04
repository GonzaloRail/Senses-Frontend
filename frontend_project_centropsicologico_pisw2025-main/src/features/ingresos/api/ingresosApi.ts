import type { IncomeReceipt, CreateIncomeReceiptInput, IncomeReceiptFilters } from "@/shared/interfaces/models/IncomeReceipt";

const STORAGE_KEY = "senses_ingresos_mock";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function pad(n: number) {
  return String(n).padStart(6, "0");
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function seedData(): IncomeReceipt[] {
  return [
    {
      id: uid(), series: "2026", number: 1, date: "2026-06-03",
      client: "Cliente Demo A", clientDni: "70000001", patient: "Paciente Demo A", patientDoc: "HCL-001",
      phone: "900111222", attention: "Particular", service: "Consulta", psychologist: "Psicólogo Demo 1",
      payment: "Yape", subtotal: 127.12, igv: 22.88, total: 150,
      status: "Vigente", createdBy: "Admissión User", createdAt: "2026-06-03T09:00:00",
    },
    {
      id: uid(), series: "2026", number: 2, date: "2026-06-05",
      client: "Cliente Demo B", clientDni: "70000002", patient: "Paciente Demo B", patientDoc: "HCL-002",
      phone: "900222333", attention: "Convenio", service: "Evaluación psicológica", psychologist: "Psicóloga Demo 2",
      payment: "Transferencia", subtotal: 237.29, igv: 42.71, total: 280,
      status: "Vigente", createdBy: "Admissión User", createdAt: "2026-06-05T09:00:00",
    },
    {
      id: uid(), series: "2026", number: 3, date: "2026-06-12",
      client: "Cliente Demo C", clientDni: "70000003", patient: "Paciente Demo C", patientDoc: "HCL-003",
      phone: "900333444", attention: "Social", service: "Terapia individual", psychologist: "Interno Demo",
      payment: "Efectivo", subtotal: 76.27, igv: 13.73, total: 90,
      status: "Vigente", createdBy: "Admissión User", createdAt: "2026-06-12T09:00:00",
    },
    {
      id: uid(), series: "2026", number: 4, date: "2026-06-17",
      client: "Cliente Demo D", clientDni: "70000004", patient: "Paciente Demo D", patientDoc: "HCL-004",
      phone: "900444555", attention: "Particular", service: "Neuropsicología", psychologist: "Psicólogo Demo 1",
      payment: "Tarjeta", subtotal: 271.19, igv: 48.81, total: 320,
      status: "Vigente", createdBy: "Admissión User", createdAt: "2026-06-17T09:00:00",
    },
    {
      id: uid(), series: "2026", number: 5, date: "2026-06-21",
      client: "Cliente Demo E", clientDni: "70000005", patient: "Paciente Demo E", patientDoc: "HCL-005",
      phone: "900555666", attention: "Particular", service: "Terapia individual", psychologist: "Psicóloga Demo 2",
      payment: "Plin", subtotal: 110.17, igv: 19.83, total: 130,
      status: "Vigente", createdBy: "Admissión User", createdAt: "2026-06-21T09:00:00",
    },
  ];
}

function loadData(): IncomeReceipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  const seeded = seedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveData(data: IncomeReceipt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const ingresosApi = {
  async getAll(): Promise<IncomeReceipt[]> {
    await delay(150);
    return loadData();
  },

  async getById(id: string): Promise<IncomeReceipt | undefined> {
    await delay(100);
    return loadData().find((r) => r.id === id);
  },

  async getFiltered(filters: IncomeReceiptFilters): Promise<IncomeReceipt[]> {
    await delay(150);
    const all = loadData();
    const from = filters.dateFrom || "";
    const to = filters.dateTo || "";
    const patient = filters.patient.toLowerCase();
    const client = filters.client.toLowerCase();
    const psych = filters.psychologist;
    const pay = filters.payment;
    const number = filters.number.replace(/^0+/, "");

    return all
      .filter((r) => {
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        if (patient && !r.patient.toLowerCase().includes(patient)) return false;
        if (client && !r.client.toLowerCase().includes(client)) return false;
        if (psych && r.psychologist !== psych) return false;
        if (pay && r.payment !== pay) return false;
        if (number && String(r.number) !== number) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
  },

  async create(input: CreateIncomeReceiptInput): Promise<IncomeReceipt> {
    await delay(200);
    const all = loadData();
    const nextNumber = all.length > 0 ? Math.max(...all.map((r) => r.number)) + 1 : 1;
    const subtotal = round2(input.total / 1.18);
    const igv = round2(input.total - subtotal);
    const receipt: IncomeReceipt = {
      ...input,
      id: uid(),
      subtotal,
      igv,
      status: "Vigente",
      createdBy: "Usuario Actual",
      createdAt: new Date().toISOString(),
    };
    all.push(receipt);
    saveData(all);
    return receipt;
  },

  async annul(id: string): Promise<void> {
    await delay(150);
    const all = loadData();
    const idx = all.findIndex((r) => r.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], status: "Anulado" };
      saveData(all);
    }
  },

  async remove(id: string): Promise<void> {
    await delay(100);
    const all = loadData().filter((r) => r.id !== id);
    saveData(all);
  },

  async reset(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
