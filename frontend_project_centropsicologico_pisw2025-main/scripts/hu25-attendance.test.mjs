import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const result = await build({
  absWorkingDir: fileURLToPath(new URL("../", import.meta.url)),
  entryPoints: ["src/features/attendance/api/attendanceApi.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  plugins: [{
    name: "attendance-http-fixtures",
    setup(builder) {
      builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({ path: "http", namespace: "attendance" }));
      builder.onLoad({ filter: /.*/, namespace: "attendance" }, () => ({
        contents: "export default { get: (...args) => globalThis.attendanceGet(...args), post: (...args) => globalThis.attendancePost(...args) }",
      }));
    },
  }],
});
const module = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { getAttendanceToday, registerPunch, getAttendanceRecords } = module.exports;
const userId = "02310df5-4ea6-4160-b041-2b77dc34a402";
const id = "d293687f-5c18-4840-8da4-8f3414f6c48b";
const at = "2026-11-09T13:00:00.000Z";

test("today accepts the deployed code's data envelope and pending status", async () => {
  const signal = new AbortController().signal;
  globalThis.attendanceGet = async (path, config) => {
    assert.equal(path, "/api/v1/attendance/today");
    assert.equal(config.signal, signal);
    return { data: {
      date: "2026-11-09", serverTime: at, undoWindowMinutes: 3, summary: { totalPending: 1 },
      data: [{ userId, fullName: "Usuario de prueba", expectedSchedule: "10:00 - 17:00", firstIn: null, lastOut: null, punchesCount: 0, status: "PENDIENTE" }],
    } };
  };
  const result = await getAttendanceToday(signal);
  assert.equal(result.staff[0].status, "PENDIENTE");
  assert.equal(result.serverTime, at);
});

test("punch accepts separate names and the server deadline without sending time or operator", async () => {
  const undoUntil = "2026-11-09T13:03:00.000Z";
  const input = { dni: "00000003", source: "DNI_MANUAL" };
  globalThis.attendancePost = async (path, body) => {
    assert.equal(path, "/api/v1/attendance/punch");
    assert.deepEqual(body, input);
    return { data: {
      record: { id, type: "IN", punchedAt: at },
      user: { id: userId, firstName: "Usuario", lastName: "de prueba" },
      undoUntil,
      provisionalDay: { date: "2026-11-09", status: "PUNTUAL", expectedStart: "08:00", expectedEnd: "17:00", lateMinutes: 0, earlyLeaveMinutes: 0 },
    } };
  };
  const result = await registerPunch(input);
  assert.equal(result.user.fullName, "Usuario de prueba");
  assert.equal(result.undoUntil, undoUntil);
});

test("record filters send an explicit false and preserve calendar dates", async () => {
  const filters = { page: 2, includeVoided: false, from: "2026-11-01", to: "2026-11-09", userId };
  globalThis.attendanceGet = async (path, config) => {
    assert.equal(path, "/api/v1/attendance/records");
    assert.deepEqual(config.params, filters);
    return { data: { totalPages: 3, records: [] } };
  };
  assert.equal((await getAttendanceRecords(filters, new AbortController().signal)).totalPages, 3);
});
