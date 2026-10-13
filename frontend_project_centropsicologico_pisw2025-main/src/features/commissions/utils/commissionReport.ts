import type { CommissionByPsychologist, CommissionReportSummary } from "@/shared/interfaces/models/Financial";

export function commissionMoney(value: number | null) {
  return value === null ? "Pendiente" : `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}

export function summarizeCommissionRows(rows: CommissionByPsychologist[]): CommissionReportSummary {
  const incomplete = rows.some((row) => row.calculationStatus !== "CALCULATED");
  const sum = (select: (row: CommissionByPsychologist) => number) =>
    Math.round(rows.reduce((total, row) => total + select(row), 0) * 100) / 100;
  const knownCommissionAmount = sum((row) => row.knownCommissionAmount);
  const knownClinicNetAmount = sum((row) => row.knownClinicNetAmount);
  return {
    grossIncome: sum((row) => row.grossIncome),
    commissionAmount: incomplete ? null : knownCommissionAmount,
    clinicNetAmount: incomplete ? null : knownClinicNetAmount,
    calculationStatus: incomplete ? "MISSING_COMMISSION_RATE" : "CALCULATED",
    knownCommissionAmount, knownClinicNetAmount,
    unresolvedGrossIncome: sum((row) => row.unresolvedGrossIncome),
    paidAppointmentsCount: sum((row) => row.receiptsCount),
  };
}
