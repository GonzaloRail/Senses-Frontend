import type { CommissionByPsychologist } from "@/shared/interfaces/models/Financial";

interface Props {
  data: CommissionByPsychologist[];
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CommissionsReport = ({ data }: Props) => {
  const active = data.filter((c) => c.grossIncome > 0);
  const totalCommission = active.reduce((s, c) => s + c.commission, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-3 text-left font-bold text-muted-foreground">Psicólogo</th>
            <th className="p-3 text-right font-bold text-muted-foreground">% Com.</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Bruto</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Comisión</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Senses 8%</th>
            <th className="p-3 text-right font-bold text-muted-foreground">IGV 18%</th>
            <th className="p-3 text-right font-bold text-muted-foreground">Costos</th>
          </tr>
        </thead>
        <tbody>
          {active.length === 0 ? (
            <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin datos</td></tr>
          ) : (
            active.map((c, i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{c.psychologist}</td>
                <td className="p-3 text-right">{Math.round(c.commissionRate * 100)}%</td>
                <td className="p-3 text-right">{money(c.grossIncome)}</td>
                <td className="p-3 text-right font-bold text-blue-600">{money(c.commission)}</td>
                <td className="p-3 text-right">{money(c.sensesFee)}</td>
                <td className="p-3 text-right">{money(c.igv)}</td>
                <td className="p-3 text-right">{money(c.costs)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex gap-4 p-4 bg-muted/30 border-t">
        <span className="text-sm font-bold">Total comisiones: <span className="text-blue-600 font-extrabold">{money(totalCommission)}</span></span>
      </div>
    </div>
  );
};
