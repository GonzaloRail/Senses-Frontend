import type { IncomeByPayment } from "@/shared/interfaces/models/Financial";

interface Props {
  data: IncomeByPayment[];
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COLORS: Record<string, string> = {
  Yape: "#2563eb",
  Plin: "#16a34a",
  Efectivo: "#ca8a04",
  Transferencia: "#7c3aed",
  Tarjeta: "#dc2626",
};

export const IncomeByPaymentChart = ({ data }: Props) => {
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h3 className="font-bold text-sm text-senses-primary mb-3">Ingresos por forma de pago</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.paymentMethod}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.paymentMethod}</span>
              <span className="font-bold">{money(item.total)} ({item.count} op.)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(item.total / maxVal) * 100}%`,
                  backgroundColor: COLORS[item.paymentMethod] || "#64748b",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
