import type { MockReceipt } from "@/shared/interfaces/models/Financial";

interface Props {
  data: MockReceipt[];
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function badge(status: string) {
  const colors: Record<string, string> = {
    Vigente: "bg-green-100 text-green-700",
    Anulado: "bg-red-100 text-red-700",
    Corregido: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

export const ReceiptsReport = ({ data }: Props) => {
  const vigentes = data.filter((r) => r.status === "Vigente").length;
  const anulados = data.filter((r) => r.status === "Anulado").length;
  const totalIncome = data.filter((r) => r.status !== "Anulado").reduce((s, r) => s + r.total, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-3 text-left font-bold text-muted-foreground">Fecha</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Paciente</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Servicio</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Psicólogo</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Pago</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Total</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Estado</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
          ) : (
            data.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-3">{dateDisplay(r.date)}</td>
                <td className="p-3">{r.patient}</td>
                <td className="p-3">{r.service}</td>
                <td className="p-3">{r.psychologist}</td>
                <td className="p-3">{r.payment}</td>
                <td className="p-3 text-right">{money(r.total)}</td>
                <td className="p-3">{badge(r.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 border-t">
        <span className="text-sm font-bold">Vigentes: <span className="text-green-600 font-extrabold">{vigentes}</span></span>
        <span className="text-sm font-bold">Anulados: <span className="text-red-600 font-extrabold">{anulados}</span></span>
        <span className="text-sm font-bold">Total recibos: <span className="font-extrabold">{data.length}</span></span>
        <span className="text-sm font-bold">Total ingresos: <span className="text-green-600 font-extrabold">{money(totalIncome)}</span></span>
      </div>
    </div>
  );
};
