import type { AccountingAuditLog } from "../api/auditApi";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  log: AccountingAuditLog | null;
  onClose: () => void;
}

export function AuditDetailsModal({ log, onClose }: Props) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">
            Detalles de Auditoría
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500 font-medium">ID de Registro</p>
              <p className="text-sm font-mono bg-slate-100 p-1 rounded mt-1">{log.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Fecha y Hora</p>
              <p className="text-sm mt-1">
                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Usuario Responsable</p>
              <p className="text-sm mt-1">{log.performedBy.firstName} {log.performedBy.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Acción</p>
              <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                log.action === "CREATED" ? "bg-emerald-100 text-emerald-700" :
                log.action === "UPDATED" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {log.action === "CREATED" ? "CREACIÓN" : log.action === "UPDATED" ? "MODIFICACIÓN" : "ELIMINACIÓN"}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Entidad Afectada</p>
              <p className="text-sm font-mono bg-slate-100 p-1 rounded mt-1">{log.entityType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">ID de Entidad</p>
              <p className="text-sm font-mono bg-slate-100 p-1 rounded mt-1">{log.entityId}</p>
            </div>
            {log.reason && (
              <div className="col-span-2">
                <p className="text-sm text-slate-500 font-medium">Razón / Motivo</p>
                <p className="text-sm mt-1 bg-slate-50 p-2 rounded border">{log.reason}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b pb-1">Dato Anterior</h3>
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono h-64 overflow-y-auto">
                {log.previousData ? JSON.stringify(log.previousData, null, 2) : "N/A (Creación de registro)"}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b pb-1">Dato Nuevo</h3>
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono h-64 overflow-y-auto">
                {log.newData ? JSON.stringify(log.newData, null, 2) : "N/A (Eliminación de registro)"}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end bg-slate-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
