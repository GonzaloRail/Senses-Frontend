import type { CommissionByPsychologist } from "@/shared/interfaces/models/Financial";

interface Props {
  data: CommissionByPsychologist[];
  onViewPsychologist: (name: string) => void;
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CommissionsTable = ({ data, onViewPsychologist }: Props) => {
  const active = data.filter((c) => c.grossIncome > 0);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-bold text-senses-primary">Comisiones por Psicólogo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 font-bold text-muted-foreground text-left">Psicólogo</th>
              <th className="p-3 font-bold text-muted-foreground text-right">% Comisión</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Total bruto</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Comisión</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Senses 8%</th>
              <th className="p-3 font-bold text-muted-foreground text-right">IGV 18%</th>
              <th className="p-3 font-bold text-muted-foreground text-center">Recibos</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No hay ingresos en el período para calcular comisiones
                </td>
              </tr>
            ) : (
              active.map((c, i) => (
                <tr key={i} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.psychologist}</td>
                  <td className="p-3 text-right">{Math.round(c.commissionRate * 100)}%</td>
                  <td className="p-3 text-right">{money(c.grossIncome)}</td>
                  <td className="p-3 text-right font-bold text-blue-600">{money(c.commission)}</td>
                  <td className="p-3 text-right">{money(c.sensesFee)}</td>
                  <td className="p-3 text-right">{money(c.igv)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onViewPsychologist(c.psychologist)}
                      className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-medium hover:bg-blue-100 transition-colors"
                    >
                      Ver ({c.receiptsCount})
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
