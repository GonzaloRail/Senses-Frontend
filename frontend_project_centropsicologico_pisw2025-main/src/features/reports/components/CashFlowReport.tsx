import type { CashFlowData } from "@/shared/interfaces/models/Financial";

interface Props {
  data: CashFlowData;
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export const CashFlowReport = ({ data }: Props) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-3 text-left font-bold text-muted-foreground">Fecha</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Saldo anterior</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Ingresos</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Egr. fijos</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Egr. variables</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Egr. activo</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Total egresos</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Saldo final</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sin movimientos</td></tr>
          ) : (
            data.rows.map((r, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-3">{dateDisplay(r.day)}</td>
                <td className="p-3 text-right">{money(r.openingBalance)}</td>
                <td className="p-3 text-right text-green-600 font-medium">{money(r.income)}</td>
                <td className="p-3 text-right">{money(r.fixedExpenses)}</td>
                <td className="p-3 text-right">{money(r.variableExpenses)}</td>
                <td className="p-3 text-right">{money(r.assetExpenses)}</td>
                <td className="p-3 text-right text-red-500">{money(r.totalExpenses)}</td>
                <td className="p-3 text-right font-bold">{money(r.closingBalance)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 border-t">
        <span className="text-sm font-bold">Saldo inicial: <span className="font-extrabold">{money(data.opening)}</span></span>
        <span className="text-sm font-bold">Ingresos: <span className="text-green-600 font-extrabold">{money(data.totalIncome)}</span></span>
        <span className="text-sm font-bold">Egresos: <span className="text-red-600 font-extrabold">{money(data.totalExpenses)}</span></span>
        <span className="text-sm font-bold">Saldo: <span className="text-senses-primary font-extrabold">{money(data.final)}</span></span>
      </div>
    </div>
  );
};
