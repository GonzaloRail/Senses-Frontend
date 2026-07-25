import { useQuery } from "@tanstack/react-query";
import type { DateMode } from "@/shared/interfaces/models/Financial";
import { fetchDashboardData, type DashboardData } from "../api/financialApi";

export function useFinancialData(
  dateMode: DateMode,
  selectedDate: Date,
  paymentFilter: string,
  customFrom: string,
  customTo: string
) {
  return useQuery<DashboardData>({
    queryKey: ["financialDashboard", dateMode, selectedDate.toISOString(), paymentFilter, customFrom, customTo],
    queryFn: () => fetchDashboardData({ dateMode, selectedDate, paymentFilter, customFrom, customTo }),
    staleTime: 30 * 1000,
  });
}
