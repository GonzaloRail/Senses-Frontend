import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { IngresosTable } from "../components/IngresosTable";
import { IngresosSummary } from "../components/IngresosSummary";
import { IngresoDetailModal } from "../components/IngresoDetailModal";
import { ReceiptPreviewModal } from "../components/ReceiptPreviewModal";
import { ChangeRequestsTable } from "../components/ChangeRequestsTable";
import { useIngresosFiltered, useDailyRegister, useChangeRequests } from "../hooks/useIngresosQueries";
import { getEmptyFilters } from "../utils/ingresosUtils";
import { exportIngresosExcel } from "../utils/exportIngresosExcel";
import { useAuth } from "@/store/auth/auth.store";
import type { IncomeReceipt, IncomeReceiptFilters } from "@/shared/interfaces/models/IncomeReceipt";
import { toast } from "sonner";

type ViewMode = "all" | "daily" | "change-requests";

function getMonthRange(month: string) {
  if (!month) return { from: "", to: "" };
  const [y, m] = month.split("-");
  const from = `${y}-${m}-01`;
  const next = new Date(Number(y), Number(m), 1);
  const to = next.toISOString().slice(0, 10);
  return { from, to };
}

export const IngresosList = () => {
  const navigate = useNavigate();
  const roleSelected = useAuth((state) => state.roleSelected);
  const isAdmin = roleSelected === "ADMIN";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [previewReceipt, setPreviewReceipt] = useState<IncomeReceipt | null>(null);

  const monthFilters: IncomeReceiptFilters = useMemo(() => {
    const range = getMonthRange(selectedMonth);
    return { ...getEmptyFilters(), dateFrom: range.from, dateTo: range.to };
  }, [selectedMonth]);

  const { data: monthReceipts = [], isLoading } = useIngresosFiltered(monthFilters);
  const { data: dailyReceipts = [], isLoading: dailyLoading } = useDailyRegister(viewMode === "daily" ? dailyDate : undefined);
  const { data: changeRequestsData, isLoading: loadingCR, refetch: refetchCR } = useChangeRequests(
    viewMode === "change-requests" ? {} : undefined
  );

  const displayReceipts = viewMode === "daily" ? dailyReceipts : monthReceipts;
  const loading = viewMode === "daily" ? dailyLoading : isLoading;

  const selectedReceipt = selectedId ? displayReceipts.find((r) => r.id === selectedId) ?? null : null;

  const handleExportExcel = useCallback(() => {
    const suffix = viewMode === "daily" ? `diario-${dailyDate}` : selectedMonth;
    exportIngresosExcel(displayReceipts, `ingresos-${suffix}`);
    toast.success("Excel exportado correctamente");
  }, [displayReceipts, viewMode, dailyDate, selectedMonth]);

  const showIncomeContent = viewMode === "all" || viewMode === "daily";

  return (
    <>
      <SiteHeader title="Registro de ingresos" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {viewMode === "daily"
                          ? "Registro diario de ingresos"
                          : viewMode === "change-requests"
                            ? "Solicitudes de cambio"
                            : "Todos los ingresos"}
                      </CardTitle>
                      <CardDescription>
                        {viewMode === "daily"
                          ? `Resumen de ingresos del día ${dailyDate}`
                          : viewMode === "change-requests"
                            ? "Anulaciones, correcciones y devoluciones pendientes de revisión"
                            : "Pagos emitidos desde recibos internos"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("all")}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={viewMode === "daily" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("daily")}
                      >
                        Registro diario
                      </Button>
                      {isAdmin && (
                        <Button
                          variant={viewMode === "change-requests" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("change-requests")}
                        >
                          Solicitudes
                        </Button>
                      )}
                      {showIncomeContent && (
                        <Button variant="outline" onClick={handleExportExcel}>
                          Exportar Excel
                        </Button>
                      )}
                      {showIncomeContent && roleSelected !== "ADMIN" && (
                        <Button onClick={() => navigate("/ingresos/create")}>
                          Nuevo ingreso
                        </Button>
                      )}
                    </div>
                  </div>
                  {viewMode === "all" && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">Filtrar por mes</label>
                        <Input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-44 h-8 text-sm"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {monthReceipts.length} ingreso(s) en el período
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "change-requests" ? (
                  <ChangeRequestsTable
                    requests={changeRequestsData?.items ?? []}
                    loading={loadingCR}
                    isAdmin={isAdmin}
                    onRefresh={refetchCR}
                  />
                ) : (
                  <>
                    {viewMode === "daily" && (
                      <div className="mb-4">
                        <input
                          type="date"
                          value={dailyDate}
                          onChange={(e) => setDailyDate(e.target.value)}
                          className="px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senses-primary" />
                      </div>
                    ) : (
                      <>
                        <IngresosTable
                          receipts={displayReceipts}
                          onView={setSelectedId}
                          onShowReceipt={setPreviewReceipt}
                        />
                        <IngresosSummary receipts={displayReceipts} />
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <IngresoDetailModal
        receipt={selectedReceipt}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        onShowReceipt={setPreviewReceipt}
      />

      <ReceiptPreviewModal
        receipt={previewReceipt}
        open={!!previewReceipt}
        onClose={() => setPreviewReceipt(null)}
      />
    </>
  );
};
