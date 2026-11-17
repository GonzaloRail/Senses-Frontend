import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/features/locations/api/locationsApi.ts"],
  bundle: true, write: false, platform: "node", format: "cjs", logLevel: "silent",
  plugins: [{
    name: "mock-api",
    setup(builder) {
      builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({ path: "api", namespace: "mock" }));
      builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
        contents: "export default { get: (...args) => globalThis.hu29Get(...args) }", loader: "js",
      }));
    },
  }],
});
const module = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
const { getAllActiveLocationsApi } = module.exports;

test("carga todas las páginas y excluye sedes inactivas", async () => {
  const calls = [];
  globalThis.hu29Get = async (url, { params }) => {
    calls.push({ url, ...params });
    return { data: params.page === 1
      ? { totalPages: 2, locations: [{ id: "a", name: "Norte", isActive: true }, { id: "b", name: "Cerrada", isActive: false }] }
      : { totalPages: 2, locations: [{ id: "c", name: "Sur", isActive: true }] } };
  };
  assert.deepEqual(await getAllActiveLocationsApi(), [{ id: "a", name: "Norte" }, { id: "c", name: "Sur" }]);
  assert.deepEqual(calls.map((call) => call.page), [1, 2]);
  assert.ok(calls.every((call) => call.url === "/api/v1/locations" && call.take === 100));
});

test("acepta un catálogo vacío", async () => {
  globalThis.hu29Get = async () => ({ data: { totalPages: 0, locations: [] } });
  assert.deepEqual(await getAllActiveLocationsApi(), []);
});

test("no presenta una respuesta incompatible como catálogo vacío", async () => {
  globalThis.hu29Get = async () => ({ data: { totalPages: 1, locations: [{ id: "a", name: "Norte" }] } });
  await assert.rejects(getAllActiveLocationsApi(), /catálogo de sedes no es válida/);
});

test("propaga errores de carga del catálogo", async () => {
  globalThis.hu29Get = async () => { throw new Error("Sin conexión"); };
  await assert.rejects(getAllActiveLocationsApi(), /Sin conexión/);
});
