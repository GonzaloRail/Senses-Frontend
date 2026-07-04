export interface IncomeReceipt {
  id: string;
  series: string;
  number: number;
  date: string;
  client: string;
  clientDni: string;
  patient: string;
  patientDoc: string;
  phone: string;
  attention: string;
  service: string;
  psychologist: string;
  payment: string;
  subtotal: number;
  igv: number;
  total: number;
  status: "Vigente" | "Anulado" | "Corregido";
  createdBy: string;
  createdAt: string;
}

export type CreateIncomeReceiptInput = Omit<IncomeReceipt, "id" | "status" | "createdBy" | "createdAt">;

export type IncomeReceiptFilters = {
  dateFrom: string;
  dateTo: string;
  patient: string;
  client: string;
  psychologist: string;
  payment: string;
  number: string;
};
