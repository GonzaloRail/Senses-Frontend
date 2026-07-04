import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { IngresosFilters } from "../components/IngresosFilters";
import { IngresosTable } from "../components/IngresosTable";
import { IngresosSummary } from "../components/IngresosSummary";
import { IngresoDetailModal } from "../components/IngresoDetailModal";
import { useIngresosFiltered } from "../hooks/useIngresosQueries";
import { useAnnulIngreso } from "../hooks/useIngresosMutations";
import { getEmptyFilters } from "../utils/ingresosUtils";
import type { IncomeReceiptFilters } from "@/shared/interfaces/models/IncomeReceipt";
import { toast } from "sonner";

export const IngresosList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<IncomeReceiptFilters>(getEmptyFilters());
  const [appliedFilters, setAppliedFilters] = useState<IncomeReceiptFilters>(getEmptyFilters());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: receipts = [], isLoading } = useIngresosFiltered(appliedFilters);
  const annulMutation = useAnnulIngreso();

  const selectedReceipt = selectedId ? receipts.find((r) => r.id === selectedId) ?? null : null;

  const handleSearch = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleAnnul = useCallback((id: string) => {
    annulMutation.mutate(id, {
      onSuccess: () => toast.success("Ingreso anulado correctamente"),
      onError: () => toast.error("Error al anular el ingreso"),
    });
  }, [annulMutation]);

  const handleExportCSV = useCallback(() => {
    const headers = [
      "Fecha", "Serie", "N°", "Cliente", "DNI", "Paciente", "DNI/HCL",
      "Servicio", "Psicólogo", "Atención", "Pago", "Subtotal", "IGV", "Total", "Estado", "Usuario",
    ];
    const rows = receipts.map((r) => [
      r.date, r.series, r.number, r.client, r.clientDni, r.patient, r.patientDoc,
      r.service, r.psychologist, r.attention, r.payment, r.subtotal, r.igv, r.total, r.status, r.createdBy,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ingresos.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado correctamente");
  }, [receipts]);

  return (
    <>
      <SiteHeader
        title="Registro de ingresos"
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registro diario de ingresos</CardTitle>
                    <CardDescription>
                      Pagos emitidos desde recibos internos. Los anulados no suman al flujo.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                      Exportar CSV
                    </Button>
                    <Button onClick={() => navigate("/ingresos/create")}>
                      Nuevo ingreso
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <IngresosFilters
                  filters={filters}
                  onChange={setFilters}
                  onSearch={handleSearch}
                />
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senses-primary" />
                  </div>
                ) : (
                  <>
                    <IngresosTable
                      receipts={receipts}
                      onView={setSelectedId}
                      onAnnul={handleAnnul}
                    />
                    <IngresosSummary receipts={receipts} />
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
      />
    </>
  );
};
