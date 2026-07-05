import * as XLSX from "xlsx";
import type { IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

const HEADERS = [
  "Fecha", "Serie", "N°", "Cliente", "DNI", "Paciente", "DNI/HCL",
  "Servicio", "Psicólogo", "Atención", "Pago", "Subtotal", "IGV", "Total", "Estado", "Usuario",
];

export function exportIngresosExcel(receipts: IncomeReceipt[], filename: string) {
  const data = receipts.map((r) => ({
    Fecha: r.date,
    Serie: r.series,
    "N°": r.number,
    Cliente: r.client,
    DNI: r.clientDni,
    Paciente: r.patient,
    "DNI/HCL": r.patientDoc,
    Servicio: r.service,
    Psicólogo: r.psychologist,
    Atención: r.attention,
    Pago: r.payment,
    Subtotal: r.subtotal,
    IGV: r.igv,
    Total: r.total,
    Estado: r.status,
    Usuario: r.createdBy,
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = HEADERS.map((key) => ({
    wch: Math.max(
      key.length * 1.5,
      ...data.map((row) => String((row as any)[key] ?? "").length)
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
