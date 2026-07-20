import type { CommissionByPsychologist, PsychologistConfig, MockReceipt } from "@/shared/interfaces/models/Financial";
import { PSYCHOLOGISTS } from "./mockData";

export function getCommissionConfig(): PsychologistConfig[] {
  return PSYCHOLOGISTS;
}

export function calculateCommissions(
  receipts: MockReceipt[],
  psychologists: PsychologistConfig[] = PSYCHOLOGISTS
): CommissionByPsychologist[] {
  return psychologists.map((p) => {
    const rpts = receipts.filter((r) => r.psychologist === p.name);
    const bruto = rpts.reduce((sum, r) => sum + r.total, 0);
    const commission = Math.round(bruto * p.commission * 100) / 100;
    const sensesFee = Math.round(bruto * 0.08 * 100) / 100;
    const igv = Math.round(bruto * 0.18 * 100) / 100;
    const costs = Math.round((bruto - commission - sensesFee - igv) * 100) / 100;
    return {
      psychologist: p.name,
      commissionRate: p.commission,
      grossIncome: bruto,
      commission,
      sensesFee,
      igv,
      costs,
      receiptsCount: rpts.length,
    };
  });
}

export function getPsychologistReceipts(psychologistName: string, receipts: MockReceipt[]): MockReceipt[] {
  return receipts.filter((r) => r.psychologist === psychologistName && r.status !== "Anulado");
}
