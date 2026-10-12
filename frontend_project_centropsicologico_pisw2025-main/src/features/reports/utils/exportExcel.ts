import * as XLSX from "xlsx";
import type { MockReceipt, MockExpense, CommissionReportData, CashFlowData } from "@/shared/interfaces/models/Financial";

function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function exportIncomesExcel(data: MockReceipt[], filename: string) {
  const rows = data.map((r) => ({
    Fecha: dateDisplay(r.date),
    Paciente: r.patient,
    Servicio: r.service,
    Psicólogo: r.psychologist,
    "Forma de pago": r.payment,
    Total: r.total,
    Estado: r.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length * 1.5, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportExpensesExcel(data: MockExpense[], filename: string) {
  const rows = data.map((e) => ({
    Fecha: dateDisplay(e.date),
    Tipo: e.type,
    Concepto: e.concept,
    Proveedor: e.provider,
    "Forma de pago": e.payment,
    Monto: e.amount,
    Estado: e.status,
    Área: e.area,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length * 1.5, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Egresos");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportCommissionsExcel(data: CommissionReportData, filename: string, dateFrom: string, dateTo: string) {
  const rows = data.rows.map((c) => ({
    Psicólogo: c.psychologist,
    "Citas cobradas": c.receiptsCount,
    "% aplicado": [...new Set(c.rateBreakdown.map((rate) => rate.percentage))].map((rate) => `${rate}%`).join(" / "),
    "Total bruto": c.grossIncome,
    Comisión: c.commission,
    "Margen neto": c.clinicNet,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length * 1.5, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comisiones");

  const summaryRows = [
    { Concepto: "Periodo", Valor: `${dateDisplay(dateFrom)} - ${dateDisplay(dateTo)}` },
    { Concepto: "Ingreso bruto", Valor: data.summary.grossIncome },
    { Concepto: "Comisiones", Valor: data.summary.commissionAmount },
    { Concepto: "Margen neto", Valor: data.summary.clinicNetAmount },
    { Concepto: "Citas cobradas", Valor: data.summary.paidAppointmentsCount },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Resumen");

  if (data.warnings.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.warnings.map((warning) => ({
        Psicólogo: `${warning.firstName} ${warning.lastName}`.trim(),
        Advertencia: warning.message,
      }))),
      "Advertencias"
    );
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportCashFlowExcel(data: CashFlowData, filename: string) {
  const rows = data.rows.map((r) => ({
    Fecha: dateDisplay(r.day),
    "Saldo anterior": r.openingBalance,
    Ingresos: r.income,
    "Egresos fijos": r.fixedExpenses,
    "Egresos variables": r.variableExpenses,
    "Egresos activo": r.assetExpenses,
    "Total egresos": r.totalExpenses,
    "Saldo final": r.closingBalance,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length * 1.5, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Flujo de fondos");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
