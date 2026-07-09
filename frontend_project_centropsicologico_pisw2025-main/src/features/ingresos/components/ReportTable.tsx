import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { money } from "../utils/ingresosUtils";

interface ReportRow {
  psychologist: string;
  patientsCount: number;
  totalIncome: number;
  commissionRate: number;
  commissionAmount: number;
}

interface Props {
  data: ReportRow[];
  loading?: boolean;
}

export const ReportTable = ({ data, loading }: Props) => {
  if (loading) {
    return <div className="text-center text-muted-foreground py-12">Cargando reporte...</div>;
  }

  if (!data.length) {
    return <div className="text-center text-muted-foreground py-12">No hay datos para el período seleccionado.</div>;
  }

  const totals = data.reduce(
    (acc, row) => ({
      patients: acc.patients + row.patientsCount,
      income: acc.income + row.totalIncome,
      commission: acc.commission + row.commissionAmount,
    }),
    { patients: 0, income: 0, commission: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Psicólogo</TableHead>
              <TableHead className="text-right">Pacientes atendidos</TableHead>
              <TableHead className="text-right">Total ingresos</TableHead>
              <TableHead className="text-right">% Comisión</TableHead>
              <TableHead className="text-right">Comisión calculada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/50">
                <TableCell className="font-medium">{row.psychologist}</TableCell>
                <TableCell className="text-right">{row.patientsCount}</TableCell>
                <TableCell className="text-right">{money(row.totalIncome)}</TableCell>
                <TableCell className="text-right">{row.commissionRate}%</TableCell>
                <TableCell className="text-right font-bold">{money(row.commissionAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground">Total pacientes</p>
            <p className="text-xl font-extrabold mt-1">{totals.patients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground">Total ingresos</p>
            <p className="text-xl font-extrabold mt-1">{money(totals.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground">Total comisiones</p>
            <p className="text-xl font-extrabold mt-1">{money(totals.commission)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
