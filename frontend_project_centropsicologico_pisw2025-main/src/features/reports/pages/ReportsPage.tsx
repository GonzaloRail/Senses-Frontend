import { useState, useCallback } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { ReportType, MockReceipt, MockExpense, CommissionByPsychologist, CashFlowData } from "@/shared/interfaces/models/Financial";
import { useReportsData } from "../hooks/useReportsData";
import { ReportFilters } from "../components/ReportFilters";
import { IncomeReport } from "../components/IncomeReport";
import { ExpensesReport } from "../components/ExpensesReport";
import { ReceiptsReport } from "../components/ReceiptsReport";
import { CommissionsReport } from "../components/CommissionsReport";
import { CashFlowReport } from "../components/CashFlowReport";
import { Loading } from "@/shared/components/Loading";
import { exportIncomesExcel, exportExpensesExcel, exportCommissionsExcel, exportCashFlowExcel } from "../utils/exportExcel";
import { exportToPdf } from "../utils/exportPdf";
import { usePsychologists } from "@/features/ingresos/hooks/useIngresosQueries";
import { searchPatientsApi } from "@/features/patients/api/patientsApi";

function dateDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const from = `${year}-${month}-01`;
  const to = `${year}-${month}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
}

const defaultMonth = getMonthRange();

export const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState(defaultMonth.from);
  const [dateTo, setDateTo] = useState(defaultMonth.to);
  const [patientId, setPatientId] = useState("");
  const [psychologist, setPsychologist] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reportType, setReportType] = useState<ReportType>("cash-flow");

  const [patientOptions, setPatientOptions] = useState<{ id: string; name: string; dni?: string }[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);

  const { data: psychologists = [], isLoading: psychLoading } = usePsychologists();

  const handlePatientSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setPatientOptions([]); return; }
    setPatientSearchLoading(true);
    try {
      const isDniOnly = /^\d+$/.test(query.trim());
      const result = await searchPatientsApi({
        dni: isDniOnly ? query.trim() : query.trim(),
        firstname: isDniOnly ? "" : query.trim(),
        lastname: "",
      });
      const items = Array.isArray(result) ? result : [];
      setPatientOptions(items.map((p: any) => ({
        id: p.id ?? "",
        name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
        dni: p.dni ?? "",
      })));
    } catch {
      setPatientOptions([]);
    } finally {
      setPatientSearchLoading(false);
    }
  }, []);

  const psychologistOptions = psychologists.map((p: any) => ({
    id: p.id ?? "",
    name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
  }));

  const { data, isLoading } = useReportsData({
    dateFrom, dateTo, patient: patientId, psychologist, paymentMethod, reportType,
  });

  const handleExportExcel = () => {
    if (!data) return;
    const filename = `reporte-${reportType}-${dateFrom}-${dateTo}`;
    switch (reportType) {
      case "income": case "receipts": exportIncomesExcel(data as MockReceipt[], filename); break;
      case "expenses": exportExpensesExcel(data as MockExpense[], filename); break;
      case "commissions": exportCommissionsExcel(data as CommissionByPsychologist[], filename); break;
      case "cash-flow": exportCashFlowExcel(data as CashFlowData, filename); break;
    }
  };

  const handleExportPdf = () => {
    if (!data) return;
    exportToPdf(reportType, data, dateFrom, dateTo);
  };

  const handleClear = () => {
    setPatientId(""); setPsychologist(""); setPaymentMethod(""); setPatientOptions([]);
    setDateFrom(defaultMonth.from); setDateTo(defaultMonth.to);
  };

  const renderReport = () => {
    if (isLoading) return <Loading message="Generando reporte..." />;
    if (!data) return <div className="p-8 text-center text-muted-foreground">Seleccione un rango de fechas para generar el reporte</div>;

    switch (reportType) {
      case "income": return <IncomeReport data={data as MockReceipt[]} />;
      case "expenses": return <ExpensesReport data={data as MockExpense[]} />;
      case "receipts": return <ReceiptsReport data={data as MockReceipt[]} />;
      case "commissions": return <CommissionsReport data={data as CommissionByPsychologist[]} />;
      case "cash-flow": return <CashFlowReport data={data as CashFlowData} />;
      default: return null;
    }
  };

  return (
    <>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer mt-4" />
      </div>
      <div className="p-4 lg:p-6">
        <ReportFilters
          dateFrom={dateFrom} dateTo={dateTo}
          patient={patientId} psychologist={psychologist}
          paymentMethod={paymentMethod} reportType={reportType}
          psychologistOptions={psychologistOptions} psychologistLoading={psychLoading}
          patientOptions={patientOptions} patientSearchLoading={patientSearchLoading}
          onDateFromChange={setDateFrom} onDateToChange={setDateTo}
          onPatientChange={setPatientId} onPatientSearch={handlePatientSearch}
          onPsychologistChange={setPsychologist} onPaymentMethodChange={setPaymentMethod}
          onReportTypeChange={setReportType}
          onClear={handleClear}
          onExportPdf={handleExportPdf} onExportExcel={handleExportExcel}
        />

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-senses-primary">
              {reportType === "income" ? "Ingresos" : reportType === "expenses" ? "Egresos" : reportType === "receipts" ? "Recibos" : reportType === "commissions" ? "Comisiones" : "Flujo de fondos"}
            </h3>
            <span className="text-xs text-muted-foreground">{dateDisplay(dateFrom)} - {dateDisplay(dateTo)}</span>
          </div>
          {renderReport()}
        </div>
      </div>
    </>
  );
};
