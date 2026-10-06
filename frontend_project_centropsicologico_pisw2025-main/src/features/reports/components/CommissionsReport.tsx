import type { CommissionReportData } from "@/shared/interfaces/models/Financial";
import { AlertTriangle } from "lucide-react";

interface Props {
  data: CommissionReportData;
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CommissionsReport = ({ data }: Props) => {
  const rateLabel = (rates: CommissionReportData["rows"][number]["rateBreakdown"]) => {
    const percentages = [...new Set(rates.map((rate) => rate.percentage))];
    return percentages.length > 0
      ? percentages.map((percentage) => `${percentage}%`).join(" / ")
      : "—";
  };

  return (
    <div>
      <div className="grid gap-3 border-b bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs font-bold uppercase text-muted-foreground">Ingreso bruto</p><p className="mt-1 text-xl font-extrabold">{money(data.summary.grossIncome)}</p></div>
        <div><p className="text-xs font-bold uppercase text-muted-foreground">Comisiones</p><p className="mt-1 text-xl font-extrabold text-blue-600">{money(data.summary.commissionAmount)}</p></div>
        <div><p className="text-xs font-bold uppercase text-muted-foreground">Margen neto</p><p className="mt-1 text-xl font-extrabold text-emerald-600">{money(data.summary.clinicNetAmount)}</p></div>
        <div><p className="text-xs font-bold uppercase text-muted-foreground">Citas cobradas</p><p className="mt-1 text-xl font-extrabold">{data.summary.paidAppointmentsCount}</p></div>
      </div>

      {data.warnings.length > 0 && (
        <div className="m-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Porcentajes pendientes de configuración</div>
          {data.warnings.map((warning) => (
            <p key={warning.psychologistId} className="text-sm">
              {`${warning.firstName} ${warning.lastName}`.trim()}: {warning.message}
            </p>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-3 text-left font-bold text-muted-foreground">Psicólogo</th>
            <th className="p-3 text-center font-bold text-muted-foreground">Citas cobradas</th>
            <th className="p-3 text-right font-bold text-muted-foreground">% aplicado</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Bruto</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Comisión</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Margen neto</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay citas cobradas en el periodo seleccionado.</td></tr>
          ) : (
            data.rows.map((c) => (
              <tr key={c.psychologistId} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{c.psychologist}</td>
                <td className="p-3 text-center">{c.receiptsCount}</td>
                <td className="p-3 text-right">{rateLabel(c.rateBreakdown)}</td>
                <td className="p-3 text-right">{money(c.grossIncome)}</td>
                <td className="p-3 text-right font-bold text-blue-600">{money(c.commission)}</td>
                <td className="p-3 text-right font-bold text-emerald-600">{money(c.clinicNet)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};
