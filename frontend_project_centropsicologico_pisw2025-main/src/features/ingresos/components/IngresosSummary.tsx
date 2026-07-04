import { Card, CardContent } from "@/components/ui/card";
import { money } from "../utils/ingresosUtils";
import type { IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  receipts: IncomeReceipt[];
}

export const IngresosSummary = ({ receipts }: Props) => {
  const vigentes = receipts.filter((r) => r.status !== "Anulado");
  const total = vigentes.reduce((sum, r) => sum + r.total, 0);
  const igv = vigentes.reduce((sum, r) => sum + r.igv, 0);
  const subtotal = vigentes.reduce((sum, r) => sum + r.subtotal, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-bold text-muted-foreground">Total ingresos vigentes</p>
          <p className="text-xl font-extrabold mt-1">{money(total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-bold text-muted-foreground">Total IGV</p>
          <p className="text-xl font-extrabold mt-1">{money(igv)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-bold text-muted-foreground">Total subtotal</p>
          <p className="text-xl font-extrabold mt-1">{money(subtotal)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-bold text-muted-foreground">Cantidad de recibos</p>
          <p className="text-xl font-extrabold mt-1">{receipts.length}</p>
        </CardContent>
      </Card>
    </div>
  );
};
