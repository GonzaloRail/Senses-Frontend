import type { QueryClient } from "@tanstack/react-query";

export async function invalidateFinancialQueries(queryClient: QueryClient) {
  await Promise.all([
    "ingresos", "income-raw", "incomeReportByPsychologist", "change-requests",
    "appointments", "commission-report", "commission-details", "reports", "financialDashboard",
  ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}
