export type AuditAction = "CREACIÓN" | "MODIFICACIÓN" | "ANULACIÓN" | "APROBACIÓN" | "EXPORTACIÓN";
export type AuditEntity = "RECIBO" | "EGRESO" | "REPORTE";
export type AuditRole = "ADMIN" | "ADMISSION" | "AUDITOR";

export interface MockAuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: AuditRole;
  action: AuditAction;
  entity: AuditEntity;
  details: string;
}

const now = Date.now();
const hour = 3600000;
const day = 86400000;

export const mockAuditLogs: MockAuditLog[] = [
  {
    id: "AUD-001",
    timestamp: new Date(now - 1000 * 60 * 5).toISOString(), // hace 5 mins
    userName: "Ana López",
    userRole: "ADMISSION",
    action: "CREACIÓN",
    entity: "RECIBO",
    details: "Se emitió el recibo de ingreso REC-2026-0012 por S/ 150.00 (Terapia Pareja).",
  },
  {
    id: "AUD-002",
    timestamp: new Date(now - hour * 2).toISOString(), // hace 2 hrs
    userName: "Carlos Ruiz",
    userRole: "ADMISSION",
    action: "ANULACIÓN",
    entity: "RECIBO",
    details: "Se anuló el recibo REC-2026-0010. Motivo: Error en selección de psicólogo.",
  },
  {
    id: "AUD-003",
    timestamp: new Date(now - hour * 5).toISOString(),
    userName: "María Gómez",
    userRole: "ADMIN",
    action: "APROBACIÓN",
    entity: "EGRESO",
    details: "Se aprobó el egreso de S/ 250.00 para 'Mantenimiento de local'.",
  },
  {
    id: "AUD-004",
    timestamp: new Date(now - day).toISOString(), // ayer
    userName: "Ana López",
    userRole: "ADMISSION",
    action: "CREACIÓN",
    entity: "RECIBO",
    details: "Se emitió el recibo de ingreso REC-2026-0009 por S/ 100.00 (Terapia Individual).",
  },
  {
    id: "AUD-005",
    timestamp: new Date(now - day - hour * 3).toISOString(),
    userName: "María Gómez",
    userRole: "ADMIN",
    action: "EXPORTACIÓN",
    entity: "REPORTE",
    details: "Exportó el reporte mensual de comisiones en formato PDF.",
  },
  {
    id: "AUD-006",
    timestamp: new Date(now - day * 2).toISOString(),
    userName: "Jorge Auditor",
    userRole: "AUDITOR",
    action: "EXPORTACIÓN",
    entity: "REPORTE",
    details: "Exportó el reporte diario de ingresos a Excel.",
  },
  {
    id: "AUD-007",
    timestamp: new Date(now - day * 3).toISOString(),
    userName: "Carlos Ruiz",
    userRole: "ADMISSION",
    action: "MODIFICACIÓN",
    entity: "EGRESO",
    details: "Se editó la glosa del egreso ID-054. 'Compra de papelería'.",
  }
];

export const uniqueUsers = Array.from(new Set(mockAuditLogs.map(log => log.userName)));
