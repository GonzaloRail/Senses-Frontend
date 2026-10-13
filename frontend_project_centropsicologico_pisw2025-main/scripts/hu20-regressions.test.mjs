import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
async function loadSource(path, mockApi = false) {
  const result = await build({
    absWorkingDir: projectRoot, entryPoints: [path], bundle: true, write: false,
    platform: "node", format: "esm", logLevel: "silent",
    plugins: mockApi ? [{
      name: "mock-http",
      setup(builder) {
        builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({ path: "http", namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: "export default { get: (...args) => globalThis.hu20Http.get(...args), put: (...args) => globalThis.hu20Http.put(...args), post: (...args) => globalThis.hu20Http.post(...args) };",
          loader: "js",
        }));
      },
    }] : [],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const amounts = await loadSource("src/features/ingresos/utils/incomeCalculations.ts");
const dates = await loadSource("src/shared/utils/limaDates.ts");
const rates = await loadSource("src/features/commissions/utils/commissionRates.ts");
const { invalidateFinancialQueries } = await loadSource("src/shared/utils/invalidateFinancialQueries.ts");
const { ingresosApi } = await loadSource("src/features/ingresos/api/ingresosApi.ts", true);
const reportHelpers = await loadSource("src/features/commissions/utils/commissionReport.ts");
const { getCommissionReportApi } = await loadSource("src/features/commissions/api/commissionsApi.ts", true);

test("missing rates preserve gross and null totals, known subtotals and warning identity across pages", async () => {
  const partial = {
    psychologist: { id: "p1", firstName: "Ana", lastName: "Perez", document: "1" },
    grossIncome: "200.00", paidAppointmentsCount: 2,
    commissionAmount: null, clinicNetAmount: null, calculationStatus: "MISSING_COMMISSION_RATE",
    knownCommissionAmount: "10.00", knownClinicNetAmount: "90.00", unresolvedGrossIncome: "100.00",
    rateBreakdown: [{ percentage: "10.00", grossIncome: "100.00", commissionAmount: "10.00", validFrom: "2026-10-01T05:00:00Z", validTo: null }],
  };
  const complete = { ...partial, psychologist: { ...partial.psychologist, id: "p2", firstName: "Luis" },
    grossIncome: "100.00", paidAppointmentsCount: 1, commissionAmount: "10.00", clinicNetAmount: "90.00",
    calculationStatus: "CALCULATED", unresolvedGrossIncome: "0.00" };
  const warning = { psychologistId: "p1", code: "MISSING_COMMISSION_RATE", appointmentId: "a2",
    allocationId: "alloc2", receiptLabel: "REC-001-2", paidAt: "2026-10-13T15:00:00Z", message: "Sin tasa" };
  globalThis.hu20Http = { get: async (_url, { params }) => ({ data: {
    data: params.page === 1 ? [partial] : [complete],
    warnings: [warning],
    summary: { grossIncome: "300.00", paidAppointmentsCount: 3, commissionAmount: null,
      clinicNetAmount: null, calculationStatus: "MISSING_COMMISSION_RATE",
      knownCommissionAmount: "20.00", knownClinicNetAmount: "180.00", unresolvedGrossIncome: "100.00" },
    meta: { page: params.page, take: 1, total: 2, totalPages: 2 },
  } }) };
  const result = await getCommissionReportApi({ dateFrom: "2026-10-01", dateTo: "2026-10-31" });
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].commission, null);
  assert.equal(result.rows[0].clinicNet, null);
  assert.equal(result.rows[0].commissionRate, null);
  assert.equal(result.rows[0].grossIncome, 200);
  assert.equal(result.rows[0].knownCommissionAmount, 10);
  assert.equal(result.summary.commissionAmount, null);
  assert.equal(result.summary.knownCommissionAmount, 20);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].firstName, "Ana");
  assert.equal(result.warnings[0].allocationId, "alloc2");
  assert.equal(reportHelpers.commissionMoney(null), "Pendiente");
  assert.notEqual(reportHelpers.commissionMoney(0), "Pendiente");
  const partialSummary = reportHelpers.summarizeCommissionRows([result.rows[0]]);
  assert.equal(partialSummary.grossIncome, 200);
  assert.equal(partialSummary.commissionAmount, null);
  assert.equal(partialSummary.knownClinicNetAmount, 90);
  const completeSummary = reportHelpers.summarizeCommissionRows([result.rows[1]]);
  assert.equal(completeSummary.commissionAmount, 10);
  assert.equal(completeSummary.clinicNetAmount, 90);
});

test("all missing rates and genuine zero commissions are distinct, including legacy complete responses", async () => {
  globalThis.hu20Http = { get: async () => ({ data: {
    data: [{ psychologist: { id: "p1", firstName: "Ana", lastName: "", document: "1" },
      grossIncome: "100", paidAppointmentsCount: 1, commissionAmount: "0", clinicNetAmount: "100", rateBreakdown: [] }],
    summary: { grossIncome: "100", commissionAmount: "0", clinicNetAmount: "100", paidAppointmentsCount: 1 },
    meta: { page: 1, take: 100, total: 1, totalPages: 1 },
  } }) };
  const result = await getCommissionReportApi({ dateFrom: "2026-10-01", dateTo: "2026-10-31" });
  assert.equal(result.summary.commissionAmount, 0);
  assert.equal(result.summary.calculationStatus, "CALCULATED");
  assert.equal(result.rows[0].knownClinicNetAmount, 100);
  const missing = { ...result.rows[0], commission: null, clinicNet: null, commissionRate: null,
    calculationStatus: "MISSING_COMMISSION_RATE", knownCommissionAmount: 0, knownClinicNetAmount: 0, unresolvedGrossIncome: 100 };
  const summary = reportHelpers.summarizeCommissionRows([missing]);
  assert.equal(summary.grossIncome, 100);
  assert.equal(summary.commissionAmount, null);
  assert.equal(summary.knownCommissionAmount, 0);
  assert.equal(summary.unresolvedGrossIncome, 100);
});

test("900 → 100 excludes the corrected receipt: 2933 → 2133, not 3033", async () => {
  const receipts = [
    { status: "Vigente", total: 2033 }, { status: "Corregido", total: 900 },
    { status: "Vigente", total: 100 }, { status: "Anulado", total: 50 },
  ];
  assert.equal(receipts.reduce((sum, receipt) => sum + amounts.getEffectiveIncomeAmount(receipt), 0), 2133);
  assert.equal(receipts.filter(amounts.isEffectiveIncome).length, 2);
  const dashboardSource = await readFile(new URL("../src/features/financial-dashboard/pages/FinancialDashboard.tsx", import.meta.url), "utf8");
  assert.match(dashboardSource, /list\.filter\(isEffectiveIncome\)/);
  assert.match(dashboardSource, /total: getEffectiveIncomeAmount\(r\)/);
});

test("pending requests preserve income; approved corrections and refunds do not", () => {
  for (const status of ["ISSUED", "CANCELLATION_REQUESTED", "CORRECTION_REQUESTED"]) {
    assert.equal(amounts.getBackendEffectiveIncomeAmount({ status, totalAmount: "900" }), 900);
  }
  for (const status of ["CORRECTED", "CANCELED", "REFUNDED", "UNKNOWN"]) {
    assert.equal(amounts.getBackendEffectiveIncomeAmount({ status, totalAmount: "900", effectiveAmount: 900 }), 0);
  }
});

test("partial refunds use effectiveAmount or allocation balances, keeping face value separate", () => {
  assert.equal(amounts.getBackendEffectiveIncomeAmount({ status: "PARTIALLY_REFUNDED", totalAmount: 900, effectiveAmount: "100" }), 100);
  assert.equal(amounts.getBackendEffectiveIncomeAmount({ status: "PARTIALLY_REFUNDED", totalAmount: 900, allocations: [
    { amount: "600", refundedAmount: "500" }, { amount: "300", refundedAmount: "300", status: "REFUNDED" },
  ] }), 100);
  assert.equal(amounts.getEffectiveIncomeAmount({ status: "Vigente", total: 900, effectiveAmount: 0 }), 0);
  assert.equal(amounts.getEffectiveIncomeAmount({ status: "Vigente", total: 900, effectiveAmount: 100 }), 100);
});

test("effective subtotal and IGV reconcile; full receipts retain original tax values", () => {
  assert.deepEqual(amounts.getEffectiveIncomeTaxAmounts({ status: "Vigente", total: 118, subtotal: 100, igv: 18 }), { total: 118, subtotal: 100, igv: 18 });
  assert.deepEqual(amounts.getEffectiveIncomeTaxAmounts({ status: "Vigente", total: 118, subtotal: 100, igv: 18, effectiveAmount: 59 }), { total: 59, subtotal: 50, igv: 9 });
  assert.deepEqual(amounts.getEffectiveIncomeTaxAmounts({ status: "Corregido", total: 118, subtotal: 100, igv: 18 }), { total: 0, subtotal: 0, igv: 0 });
});

test("Lima boundaries and month transitions do not depend on browser timezone", () => {
  assert.equal(dates.startOfLimaDayIso("2026-10-13"), "2026-10-13T05:00:00.000Z");
  assert.equal(dates.dayAfterLimaIso("2026-10-31"), "2026-11-01T05:00:00.000Z");
  assert.equal(dates.dayAfterLimaIso("2028-02-29"), "2028-03-01T05:00:00.000Z");
  assert.equal(dates.limaDate("2026-10-14T04:59:59.000Z"), "2026-10-13");
  assert.deepEqual(dates.getLimaMonthRange(new Date("2026-11-01T02:00:00.000Z")), { from: "2026-10-01", to: "2026-10-31" });
});

test("current rate uses validity dates, including a future rate flagged active", () => {
  const now = new Date("2026-10-13T17:00:00Z");
  const old = { id: "old", percentage: 25, isActive: false, validFrom: "2026-10-01T05:00:00Z", validTo: "2026-10-14T05:00:00Z" };
  const future = { id: "future", percentage: 1, isActive: true, validFrom: old.validTo, validTo: null };
  assert.equal(rates.findCurrentCommissionRate([future, old], now)?.id, "old");
  assert.equal(rates.getCommissionRateStatus(future, now), "Programada");
  assert.equal(rates.getCommissionRateStatus(old, now), "Vigente");
  assert.equal(rates.findCurrentCommissionRate([old, future], new Date(future.validFrom))?.id, "future");
  assert.equal(rates.getCommissionRateStatus(old, new Date(future.validFrom)), "Vencida");
});

test("income changes invalidate financial caches and refetch mounted commission reports", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const keys = ["ingresos", "income-raw", "incomeReportByPsychologist", "change-requests", "appointments", "commission-report", "commission-details", "reports", "financialDashboard"];
  for (const key of keys) client.setQueryData([key, "fixture"], "old");
  client.setQueryData(["inventory"], "unrelated");
  let fetches = 0;
  const observer = new QueryObserver(client, { queryKey: ["commission-report", "fixture"], queryFn: async () => { fetches++; return "updated"; } });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await invalidateFinancialQueries(client);
    assert.equal(fetches, 1);
    assert.equal(client.getQueryData(["commission-report", "fixture"]), "updated");
    for (const key of keys.filter((key) => key !== "commission-report")) assert.equal(client.getQueryState([key, "fixture"]).isInvalidated, true);
    assert.equal(client.getQueryState(["inventory"]).isInvalidated, false);
  } finally { unsubscribe(); client.clear(); }
});

test("income API fetches every page and uses the same Lima range as commissions", async () => {
  const calls = [];
  globalThis.hu20Http = { get: async (url, options) => {
    calls.push({ url, ...options.params });
    const page = options.params.page;
    return { data: { totalPages: 2, items: [{ id: `income-${page}`, totalAmount: page === 1 ? "900" : "100", status: page === 1 ? "CORRECTED" : "ISSUED", paidAt: "2026-10-14T04:00:00Z", allocations: [{ amount: page === 1 ? "900" : "100", refundedAmount: page === 1 ? "900" : "0" }] }] } };
  } };
  const result = await ingresosApi.getFiltered({ dateFrom: "2026-10-13", dateTo: "2026-10-13" });
  assert.equal(result.length, 2);
  assert.equal(result.reduce((sum, receipt) => sum + amounts.getEffectiveIncomeAmount(receipt), 0), 100);
  assert.equal(result[0].total, 900);
  assert.equal(result[0].date, "2026-10-13");
  assert.deepEqual(calls.map((call) => call.page), [1, 2]);
  for (const call of calls) {
    assert.equal(call.from, "2026-10-13T05:00:00.000Z");
    assert.equal(call.to, "2026-10-14T05:00:00.000Z");
  }
});

test("correction API preserves the supplied original paidAt; review UI supplies it", async () => {
  let body;
  globalThis.hu20Http = { put: async (_url, payload) => { body = payload; } };
  await ingresosApi.reviewChangeRequest("request-1", { status: "APPROVED", replacement: { totalAmount: 100, paidAt: "2026-10-01T17:00:00Z", paymentMethod: "CASH", allocations: [{ appointmentId: "a1", amount: 100 }] } });
  assert.equal(body.replacement.paidAt, "2026-10-01T17:00:00Z");
  const source = await readFile(new URL("../src/features/ingresos/components/ReviewChangeRequestModal.tsx", import.meta.url), "utf8");
  assert.match(source, /paidAt: incomeData\.paidAt/);
  assert.match(source, /No se pudo obtener la fecha del cobro original/);
});

test("new payments let the backend timestamp the collection, avoiding client clock skew", async () => {
  let body;
  globalThis.hu20Http = { post: async (_url, payload) => {
    body = payload;
    return { data: { id: "new", totalAmount: 100, status: "ISSUED", paidAt: "2026-10-13T17:00:00Z" } };
  } };
  await ingresosApi.create({ patientId: "patient", totalAmount: 100, payment: "Efectivo", clientName: "Test", clientDocument: "00000000", clientPhone: "900000000", allocations: [{ appointmentId: "appointment", amount: 100 }] });
  assert.equal(body.paidAt, undefined);
  const source = await readFile(new URL("../src/features/ingresos/components/IngresoForm.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /paidAt: new Date/);
});

test("daily register retains full receipt series and effective refund amount", async () => {
  globalThis.hu20Http = { get: async () => ({ data: { entries: [{ id: "daily", receiptCode: "REC-001-000012", paidAt: "2026-10-14T04:00:00Z", grossAmount: "900", netPaidAmount: "100", status: "PARTIALLY_REFUNDED" }] } }) };
  const [receipt] = await ingresosApi.getDailyRegister("2026-10-13");
  assert.equal(receipt.series, "REC-001");
  assert.equal(receipt.number, 12);
  assert.equal(receipt.date, "2026-10-13");
  assert.equal(receipt.total, 900);
  assert.equal(amounts.getEffectiveIncomeAmount(receipt), 100);
});
