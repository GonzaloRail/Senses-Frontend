import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const apiMock = {
  name: "hu23-http",
  setup(builder) {
    builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({ path: "http", namespace: "hu23" }));
    builder.onLoad({ filter: /.*/, namespace: "hu23" }, () => ({
      contents: "export default {get: (...args) => globalThis.hu23Http(...args)}", loader: "js",
    }));
  },
};
async function loadSource(entry, source) {
  const result = await build({
    absWorkingDir: projectRoot,
    ...(source ? { stdin: { contents: source, loader: "tsx", resolveDir: projectRoot } } : { entryPoints: [entry] }),
    bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic", plugins: [apiMock],
    logLevel: "silent", define: { "process.env.NODE_ENV": '"production"' },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}
const api = await loadSource("src/features/schedules/api/consolidatedScheduleApi.ts");
const utils = await loadSource("src/features/schedules/utils/consolidatedSchedule.ts");
const fixtures = () => ({
  date: "2026-10-19", timeZone: "America/Lima", shiftCutoff: "14:00",
  location: { id: "site-a", name: "Sede Real", address: "Dirección" },
  blocks: [
    { scheduleId: "block-a", psychologistId: "p-a", psychologistName: "Profesional API",
      officeId: "office-a", officeName: "Consultorio API", shift: "FULL_DAY", shiftLabel: "Mañana y tarde",
      startTime: "10:00", endTime: "18:00", status: "PARTIALLY_ON_LEAVE", statusLabel: "Permiso parcial",
      leaveIntervals: [{ startAt: "2026-10-19T14:00:00-05:00", endAt: "2026-10-19T15:00:00-05:00" }],
      isConflict: true, conflictNote: "Conflicto contra otro bloque fuera del filtro" },
    { scheduleId: "block-b", psychologistId: "p-a", psychologistName: "Profesional API",
      officeId: "office-b", officeName: "Otro consultorio", shift: "AFTERNOON", shiftLabel: "Tarde",
      startTime: "19:00", endTime: "20:00", status: "ON_LEAVE", statusLabel: "En Permiso",
      leaveIntervals: [{ startAt: "2026-10-19T19:00:00-05:00", endAt: "2026-10-19T20:00:00-05:00" }],
      isConflict: false, conflictNote: null },
  ],
  summary: { totalOfficesInLocation: 3, assignedOfficesCount: 2, professionalsCount: 1,
    blocksCount: 2, programmedBlocksCount: 0, partiallyOnLeaveBlocksCount: 1,
    onLeaveBlocksCount: 1, conflictBlocksCount: 1 },
});
const catalog = { locations: [fixtures().location], psychologists: [{ id: "p-a", fullName: "Profesional API" }] };
const response = (data) => ({ data: { status: "success", data } });

test("catalog unwraps the real backend envelope, forwarding location and AbortSignal", async () => {
  const signal = new AbortController().signal;
  globalThis.hu23Http = async (url, config) => {
    assert.equal(url, "/api/v1/work-schedules/consolidated-matrix/filters");
    assert.equal(config.params.locationId, "site-a");
    assert.equal(config.signal, signal);
    return response(catalog);
  };
  assert.deepEqual(await api.getScheduleFilters("site-a", signal), catalog);
});

test("daily request sends all four filters without converting Lima dates to UTC timestamps", async () => {
  const params = { date: "2026-10-19", locationId: "site-a", psychologistId: "p-a", shift: "MORNING" };
  const signal = new AbortController().signal;
  globalThis.hu23Http = async (url, config) => {
    assert.equal(url, "/api/v1/work-schedules/consolidated-matrix");
    assert.deepEqual(config.params, params);
    assert.equal(config.signal, signal);
    return response(fixtures());
  };
  const result = await api.getDailySchedule(params, signal);
  assert.equal(result.blocks.length, 2);
  assert.equal(result.blocks[0].shift, "FULL_DAY");
  assert.equal(result.blocks[0].isConflict, true);
  assert.equal(result.blocks[0].status, "PARTIALLY_ON_LEAVE");
  assert.equal(result.blocks[1].status, "ON_LEAVE");
  assert.equal(result.summary.professionalsCount, 1);
  assert.equal(result.summary.blocksCount, 2);
});

test("all psychologists omits the optional psychologist filter", async () => {
  globalThis.hu23Http = async (_url, config) => {
    assert.equal(config.params.psychologistId, undefined);
    return response(fixtures());
  };
  await api.getDailySchedule({ date: "2026-10-19", locationId: "site-a", shift: "ALL" });
});

test("empty responses remain genuinely empty, not demo fixtures", async () => {
  const empty = fixtures();
  empty.blocks = [];
  for (const key of Object.keys(empty.summary)) empty.summary[key] = 0;
  globalThis.hu23Http = async () => response(empty);
  assert.equal((await api.getDailySchedule({ date: empty.date, locationId: "site-a", shift: "ALL" })).blocks.length, 0);
});

test("old or malformed backend contracts are rejected instead of inventing defaults", async () => {
  globalThis.hu23Http = async () => response({ rows: [], matrix: [] });
  await assert.rejects(api.getDailySchedule({ date: "2026-10-19", locationId: "site-a", shift: "ALL" }), /contrato/);
  const old = fixtures();
  delete old.summary.partiallyOnLeaveBlocksCount;
  globalThis.hu23Http = async () => response(old);
  await assert.rejects(api.getDailySchedule({ date: old.date, locationId: "site-a", shift: "ALL" }), /contrato/);
});

test("HTTP failures propagate; 403 and 404 are not converted to empty success", async () => {
  for (const status of [403, 404, 500]) {
    const error = { isAxiosError: true, response: { status } };
    globalThis.hu23Http = async () => { throw error; };
    await assert.rejects(api.getScheduleFilters(), (actual) => actual === error);
    assert.ok(utils.scheduleErrorMessage(error).length > 15);
  }
  assert.match(utils.scheduleErrorMessage({ isAxiosError: true }), /conexión/);
});

test("calendar validation and day navigation handle leap years and month boundaries", () => {
  assert.equal(utils.validScheduleDate("2026-02-30"), false);
  assert.equal(utils.validScheduleDate("2026-02-29"), false);
  assert.equal(utils.validScheduleDate("2028-02-29"), true);
  assert.equal(utils.validScheduleDate(""), false);
  assert.equal(utils.moveScheduleDate("2026-10-31", 1), "2026-11-01");
  assert.equal(utils.moveScheduleDate("2026-11-01", -1), "2026-10-31");
  assert.equal(utils.moveScheduleDate("", 1), "");
  assert.match(utils.scheduleDateTitle(""), /válida/);
});

test("permission intervals format in Lima regardless of incoming ISO offset", () => {
  assert.equal(utils.leaveIntervalLabel({ startAt: "2026-10-19T19:00:00Z", endAt: "2026-10-19T20:00:00Z" }), "14:00–15:00");
});

const ui = await loadSource(null, `
  import React from "react";
  import { renderToString } from "react-dom/server";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { GeneralSchedule } from "@/features/schedules/components/GeneralSchedule";
  import { limaDate } from "@/shared/utils/limaDates";
  export function render(catalog, report, emptySites = false) {
    const client = new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
    const date = limaDate(new Date());
    client.setQueryData(["consolidated-schedule-locations"], emptySites ? {locations:[],psychologists:[]} : catalog);
    if (!emptySites) {
      client.setQueryData(["consolidated-schedule-filters","site-a"],catalog);
      client.setQueryData(["consolidated-schedule",date,"site-a","all","ALL"],{...report,date});
    }
    const html = renderToString(<QueryClientProvider client={client}><GeneralSchedule /></QueryClientProvider>);
    client.clear();
    return html;
  }
`);

test("render displays real blocks, partial permissions and conflicts without demo labels", () => {
  const html = ui.render(catalog, fixtures());
  assert.match(html, /Profesional API/);
  assert.match(html, /Consultorio API/);
  assert.match(html, /Permiso parcial/);
  assert.match(html, /14:00–15:00/);
  assert.match(html, /fuera del filtro/);
  assert.match(html, /Mañana y tarde/);
  assert.doesNotMatch(html, /Datos ficticios|Ana Salazar|Restablecer ejemplo/);
});

test("render distinguishes no active sites from a valid result with no schedules", () => {
  assert.match(ui.render(catalog, fixtures(), true), /No hay sedes activas/);
  const empty = fixtures();
  empty.blocks = [];
  for (const key of Object.keys(empty.summary)) empty.summary[key] = 0;
  assert.match(ui.render(catalog, empty), /No hay programación para estos filtros/);
});
