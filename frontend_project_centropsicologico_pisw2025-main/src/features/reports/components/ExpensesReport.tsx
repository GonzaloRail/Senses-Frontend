import type { MockExpense } from "@/shared/interfaces/models/Financial";

interface Props {
  data: MockExpense[];
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
    Aprobado: "bg-green-100 text-green-700",
    Pendiente: "bg-yellow-100 text-yellow-700",
    Rechazado: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

export const ExpensesReport = ({ data }: Props) => {
  const total = data.reduce((s, e) => s + e.amount, 0);
  const approved = data.filter((e) => e.status === "Aprobado").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-3 text-left font-bold text-muted-foreground">Fecha</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Tipo</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Concepto</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Proveedor</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Pago</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Monto</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Estado</th>
            <th className="p-3 text-left font-bold text-muted-foreground">Área</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
          ) : (
            data.map((e) => (
              <tr key={e.id} className="border-t hover:bg-muted/30">
                <td className="p-3">{dateDisplay(e.date)}</td>
                <td className="p-3">{e.type}</td>
                <td className="p-3">{e.concept}</td>
                <td className="p-3">{e.provider}</td>
                <td className="p-3">{e.payment}</td>
                <td className="p-3 text-right">{money(e.amount)}</td>
                <td className="p-3">{badge(e.status)}</td>
                <td className="p-3">{e.area}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex gap-4 p-4 bg-muted/30 border-t">
        <span className="text-sm font-bold">Total: <span className="font-extrabold">{money(total)}</span></span>
        <span className="text-sm font-bold">Aprobados: <span className="text-green-600 font-extrabold">{money(approved)}</span></span>
        <span className="text-sm font-bold">Cantidad: <span className="font-extrabold">{data.length}</span></span>
      </div>
    </div>
  );
};
