import type { FinancialSummary } from "@/shared/interfaces/models/Financial";

interface Props {
  summary: FinancialSummary;
  onIncomeClick: () => void;
  onExpenseClick: () => void;
  onBalanceClick: () => void;
  onCommissionClick: () => void;
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const KPICards = ({ summary, onIncomeClick, onExpenseClick, onBalanceClick, onCommissionClick }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <button
        onClick={onIncomeClick}
        className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ingresos</p>
        <p className="text-2xl font-extrabold text-green-600 mt-1">{money(summary.totalIncome)}</p>
        <p className="text-xs text-muted-foreground mt-1">{summary.incomeCount} recibos vigentes</p>
      </button>

      <button
        onClick={onExpenseClick}
        className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Egresos Aprobados</p>
        <p className="text-2xl font-extrabold text-red-600 mt-1">{money(summary.totalExpenses)}</p>
        <p className="text-xs text-muted-foreground mt-1">{summary.expensesCount} egresos</p>
      </button>

      <button
        onClick={onBalanceClick}
        className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Saldo Disponible</p>
        <p className="text-2xl font-extrabold text-senses-primary mt-1">{money(summary.availableBalance)}</p>
        <p className="text-xs text-muted-foreground mt-1">Saldo inicial {money(summary.openingBalance)}</p>
      </button>

      <button
        onClick={onCommissionClick}
        className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Comisiones Generadas</p>
        <p className="text-2xl font-extrabold text-blue-600 mt-1">{money(summary.totalCommissions)}</p>
        <p className="text-xs text-muted-foreground mt-1">Click para detalle</p>
      </button>
    </div>
  );
};
