import type { CommissionByPsychologist, PsychologistConfig, MockReceipt } from "@/shared/interfaces/models/Financial";
import { PSYCHOLOGISTS } from "./mockData";

export function getCommissionConfig(): PsychologistConfig[] {
  return PSYCHOLOGISTS;
}

function calcCommissionEntry(
  name: string,
  receipts: MockReceipt[],
  rate: number
): CommissionByPsychologist {
  const rpts = receipts.filter((r) => r.psychologist === name);
  const bruto = rpts.reduce((sum, r) => sum + r.total, 0);
  const commission = Math.round(bruto * rate * 100) / 100;
  const sensesFee = Math.round(bruto * 0.08 * 100) / 100;
  const igv = Math.round(bruto * 0.18 * 100) / 100;
  const costs = Math.round((bruto - commission - sensesFee - igv) * 100) / 100;
  return {
    psychologist: name,
    commissionRate: rate,
    grossIncome: bruto,
    commission,
    sensesFee,
    igv,
    costs,
    receiptsCount: rpts.length,
  };
}

export function calculateCommissions(
  receipts: MockReceipt[],
  psychologists: PsychologistConfig[] = PSYCHOLOGISTS
): CommissionByPsychologist[] {
  return psychologists.map((p) => calcCommissionEntry(p.name, receipts, p.commission));
}

export function calculateCommissionsFromReceipts(
  receipts: MockReceipt[],
  defaultRate = 0.5
): CommissionByPsychologist[] {
  const names = Array.from(
    new Set(
      receipts
        .filter((r) => r.psychologist && r.psychologist.trim() !== "")
        .map((r) => r.psychologist)
    )
  );

  const configuredMap = new Map(
    PSYCHOLOGISTS.map((p) => [p.name, p.commission])
  );

  return names
    .map((name) => {
      const rate = configuredMap.get(name) ?? defaultRate;
      return calcCommissionEntry(name, receipts, rate);
    })
    .sort((a, b) => b.grossIncome - a.grossIncome);
}

export function getPsychologistReceipts(psychologistName: string, receipts: MockReceipt[]): MockReceipt[] {
  return receipts.filter((r) => r.psychologist === psychologistName && r.status !== "Anulado");
}
