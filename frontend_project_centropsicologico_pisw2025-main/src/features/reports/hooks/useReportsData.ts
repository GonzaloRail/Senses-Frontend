import { useQuery } from "@tanstack/react-query";
import { fetchReport } from "../api/reportsApi";

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  patient: string;
  psychologist: string;
  paymentMethod: string;
  reportType: string;
}

export function useReportsData(filters: ReportFilters) {
  const type = filters.reportType as "income" | "expenses" | "receipts" | "commissions" | "cash-flow";

  return useQuery({
    queryKey: ["reports", filters],
    queryFn: () => fetchReport(type, {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      patient: filters.patient,
      psychologist: filters.psychologist,
      paymentMethod: filters.paymentMethod,
    }),
    enabled: !!(filters.dateFrom && filters.dateTo),
    staleTime: 30 * 1000,
  });
}
