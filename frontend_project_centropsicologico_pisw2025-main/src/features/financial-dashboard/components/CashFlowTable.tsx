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

export const CashFlowTable = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-bold text-senses-primary">Flujo de Fondos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 font-bold text-muted-foreground text-left">Fecha</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Saldo anterior</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Ingresos</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Egr. fijos</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Egr. variables</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Egr. activo</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Total egresos</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No hay movimientos en el período seleccionado
                </td>
              </tr>
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
      </div>
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 border-t">
        <span className="text-sm font-bold">
          Saldo inicial: <span className="font-extrabold">{money(data.opening)}</span>
        </span>
        <span className="text-sm font-bold">
          Total ingresos: <span className="font-extrabold text-green-600">{money(data.totalIncome)}</span>
        </span>
        <span className="text-sm font-bold">
          Total egresos: <span className="font-extrabold text-red-600">{money(data.totalExpenses)}</span>
        </span>
        <span className="text-sm font-bold">
          Saldo del período: <span className="font-extrabold text-senses-primary">{money(data.final)}</span>
        </span>
      </div>
    </div>
  );
};
