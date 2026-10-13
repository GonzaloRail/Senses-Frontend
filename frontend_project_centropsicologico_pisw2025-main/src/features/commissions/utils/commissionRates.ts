import type { CommissionRate } from "../api/commissionsApi";

export function getCommissionRateStatus(rate: CommissionRate, now = new Date()) {
  if (new Date(rate.validFrom) > now) return "Programada";
  if (rate.validTo && new Date(rate.validTo) <= now) return "Vencida";
  return "Vigente";
}

export function findCurrentCommissionRate(rates: CommissionRate[], now = new Date()) {
  return [...rates].sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime())
    .find((rate) => getCommissionRateStatus(rate, now) === "Vigente");
}
