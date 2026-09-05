import * as XLSX from "xlsx";
import type { InventoryItem, InventoryCategory } from "../api/inventoryApi";
import jsPDF from "jspdf";
import "jspdf-autotable";

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function exportInventoryExcel(data: InventoryItem[], categories: InventoryCategory[], filename: string) {
  const situationMap = {
    OPERATIVE: "Operativo",
    MAINTENANCE: "En Mantenimiento",
    DECOMMISSIONED: "Dado de Baja",
  };

  const rows = data.map((item, index) => ({
    "N°": index + 1,
    "FACTURA": item.invoiceNumber || "NO",
    "Denominación": item.name,
    "Marca": item.brand || "NO ESPECIFICA",
    "Modelo": item.model || "NO ESPECIFICA",
    "Tipo (Categoría)": categories.find(c => c.id === item.categoryId)?.name || "Desconocida",
    "Color": item.color || "NO ESPECIFICA",
    "Serie": item.serialNumber || "NO ESPECIFICA",
    "Dimensiones": item.dimensions || "NO ESPECIFICA",
    "Detalles": item.description || "NO ESPECIFICA",
    "Cant.": item.quantity,
    "Precio Uni.": item.unitPrice || 0,
    "Total": item.totalPrice || ((item.unitPrice || 0) * item.quantity),
    "SITUACIÓN": situationMap[item.situation],
    "Fecha de Registro": formatDate(item.createdAt)
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length * 1.5, 12) }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportInventoryPdf(data: InventoryItem[], categories: InventoryCategory[], filename: string) {
  const situationMap = {
    OPERATIVE: "Operativo",
    MAINTENANCE: "Mantenimiento",
    DECOMMISSIONED: "Dado de Baja",
  };

  const doc = new jsPDF("landscape");
  doc.text("Inventario de Activos", 14, 15);
  
  const tableData = data.map((item, index) => [
    index + 1,
    item.invoiceNumber || "NO",
    item.name,
    categories.find(c => c.id === item.categoryId)?.name || "N/A",
    item.quantity,
    item.unitPrice || 0,
    item.totalPrice || ((item.unitPrice || 0) * item.quantity),
    situationMap[item.situation]
  ]);

  (doc as any).autoTable({
    startY: 25,
    head: [["N°", "Factura", "Denominación", "Categoría", "Cant.", "Precio U.", "Total", "Situación"]],
    body: tableData,
  });

  doc.save(`${filename}.pdf`);
}
