import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  type AccountingAuditLog,
  getAccountingAuditLogsApi,
  type GetAuditLogsParams,
} from "../api/auditApi";
import { AuditDetailsModal } from "../components/AuditDetailsModal";

export function AuditPage() {
  const [logs, setLogs] = useState<AccountingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccountingAuditLog | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [actionFilter, setActionFilter] = useState<string>("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: GetAuditLogsParams = { page, take: 15 };
      if (actionFilter) params.action = actionFilter;

      const response = await getAccountingAuditLogsApi(params);
      setLogs(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalRecords(response.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar la auditoría");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleActionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value);
    setPage(1); // Reset page on filter
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auditoría Contable</h1>
          <p className="text-slate-500 mt-1">
            Registro histórico inalterable de todos los movimientos de caja, comisiones y citas.
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={actionFilter}
            onChange={handleActionFilterChange}
            className="px-4 py-2 border rounded-md text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las Acciones</option>
            <option value="CREATED">Creaciones (CREATED)</option>
            <option value="UPDATED">Modificaciones (UPDATED)</option>
            <option value="DELETED">Eliminaciones (DELETED)</option>
          </select>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium text-sm transition-colors"
          >
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Usuario Responsable</th>
                <th className="px-6 py-4">Entidad</th>
                <th className="px-6 py-4">Acción</th>
                <th className="px-6 py-4 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Cargando registros...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">
                        {log.performedBy.firstName} {log.performedBy.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {log.performedById.split("-")[0]}...
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.action === "CREATED" ? "bg-emerald-100 text-emerald-700" :
                        log.action === "UPDATED" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      >
                        Ver Cambios
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="text-sm text-slate-500">
              Mostrando página <span className="font-medium text-slate-700">{page}</span> de <span className="font-medium text-slate-700">{totalPages}</span> ({totalRecords} registros en total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditDetailsModal 
        log={selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />
    </div>
  );
}
