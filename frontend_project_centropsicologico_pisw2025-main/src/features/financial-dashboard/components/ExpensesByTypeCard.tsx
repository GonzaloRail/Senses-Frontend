import type { ExpenseByType } from "@/shared/interfaces/models/Financial";

interface Props {
  data: ExpenseByType[];
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TYPE_STYLES: Record<string, { border: string; bg: string; text: string; label: string }> = {
  Fijo: { border: "border-l-red-500", bg: "bg-red-50", text: "text-red-600", label: "Alquiler, servicios" },
  Variable: { border: "border-l-orange-500", bg: "bg-orange-50", text: "text-orange-600", label: "Materiales, publicidad" },
  Activo: { border: "border-l-yellow-500", bg: "bg-yellow-50", text: "text-yellow-600", label: "Equipos, mobiliario" },
};

export const ExpensesByTypeCard = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h3 className="font-bold text-sm text-senses-primary mb-3">Egresos por tipo</h3>
      <div className="space-y-3">
        {data.map((item) => {
          const style = TYPE_STYLES[item.type] || { border: "border-l-gray-500", bg: "bg-gray-50", text: "text-gray-600", label: "" };
          return (
            <div key={item.type} className={`border-l-4 ${style.border} ${style.bg} rounded-lg p-3`}>
              <p className="font-bold text-sm">{item.type}</p>
              <p className={`text-xl font-extrabold ${style.text}`}>{money(item.total)}</p>
              <p className="text-xs text-muted-foreground">{item.count} egreso(s) · {style.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
