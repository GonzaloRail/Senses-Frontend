interface ReceiptAmount {
  status: string;
  total: number;
  effectiveAmount?: number;
}

interface BackendIncomeAmount {
  status: string;
  totalAmount: number | string;
  effectiveAmount?: number | string | null;
  allocations?: Array<{
    amount: number | string;
    refundedAmount?: number | string | null;
    status?: string;
  }>;
}

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const isEffectiveIncome = (receipt: Pick<ReceiptAmount, "status">) =>
  receipt.status === "Vigente";

export function getEffectiveIncomeAmount(receipt: ReceiptAmount) {
  if (!isEffectiveIncome(receipt)) return 0;
  return roundMoney(Math.max(0, receipt.effectiveAmount ?? receipt.total));
}

// Keep the face value of the receipt separate from its contribution to financial totals.
export function getBackendEffectiveIncomeAmount(income: BackendIncomeAmount) {
  if (!["ISSUED", "CANCELLATION_REQUESTED", "CORRECTION_REQUESTED", "PARTIALLY_REFUNDED"].includes(income.status)) return 0;
  if (income.effectiveAmount != null) return roundMoney(Math.max(0, Number(income.effectiveAmount)));
  if (income.allocations?.length) {
    return roundMoney(income.allocations.reduce((sum, allocation) =>
      sum + (allocation.status === "REFUNDED" ? 0 : Math.max(0, Number(allocation.amount) - Number(allocation.refundedAmount ?? 0))), 0));
  }
  return roundMoney(Math.max(0, Number(income.totalAmount)));
}

export function getEffectiveIncomeTaxAmounts(receipt: ReceiptAmount & { subtotal: number; igv: number }) {
  const total = getEffectiveIncomeAmount(receipt);
  if (total === 0) return { total: 0, subtotal: 0, igv: 0 };
  if (total === receipt.total) return { total, subtotal: receipt.subtotal, igv: receipt.igv };
  const subtotal = roundMoney(receipt.total > 0 ? receipt.subtotal * total / receipt.total : 0);
  return { total, subtotal, igv: roundMoney(total - subtotal) };
}
