import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { DateMode, MockReceipt, MockExpense } from "@/shared/interfaces/models/Financial";
import { useFinancialData } from "../hooks/useFinancialData";
import { DateRangeSelector } from "../components/DateRangeSelector";
import { KPICards } from "../components/KPICards";
import { IncomeByPaymentChart } from "../components/IncomeByPaymentChart";
import { ExpensesByTypeCard } from "../components/ExpensesByTypeCard";
import { CashFlowTable } from "../components/CashFlowTable";
import { CommissionsTable } from "../components/CommissionsTable";
import { DetailModal } from "../components/DetailModal";
import { Loading } from "@/shared/components/Loading";
import { ingresosApi } from "@/features/ingresos/api/ingresosApi";
import { accountingExpensesApi } from "@/features/accounting/api/accountingExpensesApi";

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function getDateRange(dateMode: DateMode, selectedDate: Date, customFrom: string, customTo: string) {
  if (dateMode === "day") {
    const d = selectedDate.toISOString().slice(0, 10);
    return { from: d, to: d };
  }
  if (dateMode === "week") {
    const to = selectedDate.toISOString().slice(0, 10);
    const from = new Date(selectedDate.getTime() - 6 * 86400000).toISOString().slice(0, 10);
    return { from, to };
  }
  if (dateMode === "month") {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const from = `${year}-${month}-01`;
    const lastDay = new Date(year, selectedDate.getMonth() + 1, 0).getDate();
    const to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  }
  return { from: customFrom, to: customTo };
}

async function fetchReceipts(from: string, to: string, paymentFilter?: string): Promise<MockReceipt[]> {
  const list = await ingresosApi.getFiltered({
    dateFrom: from, dateTo: to,
    patient: "", client: "", psychologist: "",
    payment: paymentFilter ?? "", number: "",
  });
  return list.filter((r) => r.status !== "Anulado").map((r) => ({
    id: r.id as any,
    date: r.date, client: r.client, patient: r.patient,
    service: r.service, psychologist: r.psychologist,
    payment: r.payment, total: r.total, status: r.status,
  }));
}

async function fetchExpenses(from: string, to: string): Promise<MockExpense[]> {
  const result = await accountingExpensesApi.getAll({
    take: 200,
    startDate: new Date(from).toISOString(),
    endDate: new Date(to + "T23:59:59").toISOString(),
  });
  return (result?.data ?? [])
    .filter((item) => item.status === "APPROVED").map((item) => ({
    id: item.id as any,
    date: item.createdAt?.slice(0, 10) ?? "",
    type: item.type ?? "Variable",
    concept: item.concept ?? "",
    provider: item.supplierName ?? "",
    payment: item.paymentMethod === "CASH" ? "Efectivo" :
             item.paymentMethod === "YAPE" ? "Yape" :
             item.paymentMethod === "PLIN" ? "Plin" :
             item.paymentMethod === "BANK_TRANSFER" ? "Transferencia" :
             item.paymentMethod === "CARD" ? "Tarjeta" : item.paymentMethod,
    amount: Number(item.amount),
    status: "Aprobado" as const,
    area: item.purpose ?? "",
  }));
}

export const FinancialDashboard = () => {
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [customFrom, setCustomFrom] = useState("2026-06-01");
  const [customTo, setCustomTo] = useState("2026-06-30");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const { data, isLoading, isError, error } = useFinancialData(
    dateMode, selectedDate, paymentFilter, customFrom, customTo
  );

  const dr = getDateRange(dateMode, selectedDate, customFrom, customTo);

  const showModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const handleIncomeDetail = async () => {
    showModal("Detalle de Ingresos", <Loading message="Cargando ingresos..." />);
    const receipts = await fetchReceipts(dr.from, dr.to, paymentFilter);
    const total = receipts.reduce((s, r) => s + r.total, 0);
    showModal("Detalle de Ingresos", (
      <div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50">
            <th className="p-2 text-left font-bold text-muted-foreground">Fecha</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Paciente</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Servicio</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Psicólogo</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Pago</th>
            <th className="p-2 text-right font-bold text-muted-foreground">Total</th>
          </tr></thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Sin registros</td></tr>
            ) : receipts.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-2">{dateDisplay(r.date)}</td>
                <td className="p-2">{r.patient}</td>
                <td className="p-2">{r.service}</td>
                <td className="p-2">{r.psychologist}</td>
                <td className="p-2">{r.payment}</td>
                <td className="p-2 text-right font-medium">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right font-bold text-green-600">Total: {money(total)}</p>
      </div>
    ));
  };

  const handleExpenseDetail = async () => {
    showModal("Detalle de Egresos Aprobados", <Loading message="Cargando egresos..." />);
    const exps = await fetchExpenses(dr.from, dr.to);
    const total = exps.reduce((s, e) => s + e.amount, 0);
    showModal("Detalle de Egresos Aprobados", (
      <div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50">
            <th className="p-2 text-left font-bold text-muted-foreground">Fecha</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Tipo</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Concepto</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Proveedor</th>
            <th className="p-2 text-right font-bold text-muted-foreground">Monto</th>
          </tr></thead>
          <tbody>
            {exps.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Sin registros</td></tr>
            ) : exps.map((e) => (
              <tr key={e.id} className="border-t hover:bg-muted/30">
                <td className="p-2">{dateDisplay(e.date)}</td>
                <td className="p-2">{e.type}</td>
                <td className="p-2">{e.concept}</td>
                <td className="p-2">{e.provider}</td>
                <td className="p-2 text-right">{money(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right font-bold text-red-600">Total: {money(total)}</p>
      </div>
    ));
  };

  const handleViewPsychologist = async (psychName: string) => {
    showModal(`Recibos de ${psychName}`, <Loading message="Cargando..." />);
    const receipts = (await fetchReceipts(dr.from, dr.to)).filter((r) => r.psychologist === psychName);
    const total = receipts.reduce((s, r) => s + r.total, 0);
    showModal(`Recibos de ${psychName}`, receipts.length > 0 ? (
      <div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50">
            <th className="p-2 text-left font-bold text-muted-foreground">Fecha</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Paciente</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Servicio</th>
            <th className="p-2 text-left font-bold text-muted-foreground">Pago</th>
            <th className="p-2 text-right font-bold text-muted-foreground">Total</th>
          </tr></thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-2">{dateDisplay(r.date)}</td>
                <td className="p-2">{r.patient}</td>
                <td className="p-2">{r.service}</td>
                <td className="p-2">{r.payment}</td>
                <td className="p-2 text-right">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right font-bold">Total: {money(total)}</p>
      </div>
    ) : <p className="text-center text-muted-foreground py-4">Sin ingresos en el período</p>);
  };

  return (
    <>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
      </div>
      <div className="p-4 lg:p-6">
        <DateRangeSelector
          dateMode={dateMode} selectedDate={selectedDate}
          customFrom={customFrom} customTo={customTo}
          paymentFilter={paymentFilter}
          onDateModeChange={setDateMode} onSelectedDateChange={setSelectedDate}
          onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo}
          onPaymentFilterChange={setPaymentFilter}
          onClearFilters={() => { setPaymentFilter(""); setDateMode("month"); setSelectedDate(new Date()); }}
        />

        {isLoading ? (
          <Loading message="Cargando dashboard financiero..." />
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-bold">Error de conexión</p>
            <p className="text-sm mt-1">{(error as Error)?.message || "No se pudo conectar con el servidor"}</p>
          </div>
        ) : data ? (
          <>
            <KPICards
              summary={data.summary}
              onIncomeClick={handleIncomeDetail}
              onExpenseClick={handleExpenseDetail}
              onBalanceClick={() => showModal("Detalle de Saldo Disponible", (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Saldo inicial</p>
                      <p className="text-2xl font-extrabold mt-1">{money(data.cashFlow.opening)}</p>
                    </div>
                    <div className="border border-green-300 rounded-lg p-4 text-center bg-green-50">
                      <p className="text-xs font-bold text-green-700 uppercase">Total ingresos</p>
                      <p className="text-2xl font-extrabold mt-1 text-green-600">{money(data.cashFlow.totalIncome)}</p>
                    </div>
                    <div className="border border-red-300 rounded-lg p-4 text-center bg-red-50">
                      <p className="text-xs font-bold text-red-700 uppercase">Total egresos</p>
                      <p className="text-2xl font-extrabold mt-1 text-red-600">{money(data.cashFlow.totalExpenses)}</p>
                    </div>
                  </div>
                  <div className="border-2 border-senses-primary/20 rounded-lg p-4 text-center bg-blue-50">
                    <p className="text-xs font-bold text-senses-primary uppercase">Saldo disponible</p>
                    <p className="text-3xl font-extrabold text-senses-primary mt-1">{money(data.cashFlow.final)}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground text-center">Saldo disponible = Saldo inicial + Ingresos - Egresos aprobados</p>
                </div>
              ))}
              onCommissionClick={() => {
                const active = data.commissions.filter((c) => c.grossIncome > 0);
                const total = data.commissions.reduce((s, c) => s + c.commission, 0);
                showModal("Detalle de Comisiones Generadas", (
                  <div>
                    <table className="w-full text-sm">
                      <thead><tr className="bg-muted/50">
                        <th className="p-2 text-left font-bold text-muted-foreground">Psicólogo</th>
                        <th className="p-2 text-right font-bold text-muted-foreground">%</th>
                        <th className="p-2 text-right font-bold text-muted-foreground">Bruto</th>
                        <th className="p-2 text-right font-bold text-muted-foreground">Comisión</th>
                      </tr></thead>
                      <tbody>
                        {active.length === 0 ? (
                          <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Sin datos</td></tr>
                        ) : active.map((c, i) => (
                          <tr key={i} className="border-t hover:bg-muted/30">
                            <td className="p-2">{c.psychologist}</td>
                            <td className="p-2 text-right">{Math.round(c.commissionRate * 100)}%</td>
                            <td className="p-2 text-right">{money(c.grossIncome)}</td>
                            <td className="p-2 text-right font-bold text-blue-600">{money(c.commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-3 text-right font-bold text-blue-600">Total comisiones: {money(total)}</p>
                  </div>
                ));
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <IncomeByPaymentChart data={data.incomeByPayment} />
              <ExpensesByTypeCard data={data.expensesByType} />
            </div>

            <div className="mb-6"><CashFlowTable data={data.cashFlow} /></div>

            <CommissionsTable data={data.commissions} onViewPsychologist={handleViewPsychologist} />
          </>
        ) : null}
      </div>

      <DetailModal open={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>
        {modalContent}
      </DetailModal>
    </>
  );
};
