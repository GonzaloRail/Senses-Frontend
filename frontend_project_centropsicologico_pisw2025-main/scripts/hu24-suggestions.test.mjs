import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
async function load(path) {
  const result = await build({
    absWorkingDir: root, entryPoints: [path], bundle: true, write: false,
    platform: "node", format: "esm", logLevel: "silent",
    plugins: [{ name: "mock-api", setup(builder) {
      builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({ path: "api", namespace: "mock" }));
      builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export default globalThis.hu24Api", loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

test("validates HU24 fields, consent-based anonymity and physical-form importance", async () => {
  const model = await load("src/features/suggestions/suggestions.ts");
  const body = { respondentType: "PATIENT", recordType: "SUGGESTION", area: "ORGANIZATION", message: "  Mejorar señalización  ", contactConsent: false, perceivedImportance: "MEDIUM" };
  assert.equal(model.suggestionInputSchema.parse(body).message, "Mejorar señalización");
  assert.equal(model.suggestionInputSchema.safeParse({ ...body, message: " " }).success, false);
  assert.equal(model.suggestionInputSchema.safeParse({ ...body, respondentType: "OTHER" }).success, false);
  assert.equal(model.suggestionInputSchema.safeParse({ ...body, contactName: "Ana" }).success, false);
  assert.equal(model.suggestionInputSchema.safeParse({ ...body, perceivedImportance: null }).success, true);
  assert.equal(model.suggestionInputSchema.safeParse({ ...body, message: "x".repeat(2001) }).success, false);
});

test("sends the backend DTO, uses public endpoint separately, and parses HR list shape", async () => {
  const calls = [];
  globalThis.hu24Api = new Proxy({}, { get: (_, method) => async (...args) => {
    calls.push([method, ...args]);
    if (method === "post") return { data: { id: "receipt", code: "SUG-2026-001", status: "NEW" } };
    if (method === "get" && args[0].endsWith("/report")) return { data: new Blob(["pdf"]) };
    if (method === "get") return { data: { data: [], meta: { page: 1, take: 20, total: 0, totalPages: 0 } } };
    return { data: {} };
  } });
  const api = await load("src/features/suggestions/api/suggestionsApi.ts");
  const input = { respondentType: "PSYCHOLOGIST", recordType: "OBSERVATION", area: "OTHER", areaOther: "Atención", message: "Revisar", contactConsent: false, perceivedImportance: "HIGH" };
  await api.createSuggestion(input);
  assert.equal(calls[0][1], "/api/v1/suggestions");
  assert.equal(calls[0][2].authorId, undefined);
  await api.createSuggestion({ ...input, respondentType: "PATIENT", area: "ORGANIZATION", areaOther: null }, "public");
  assert.equal(calls[1][1], "/api/v1/suggestions/public");
  const page = await api.getSuggestions({ page: 1 });
  assert.equal(page.meta.take, 20);
  assert.deepEqual(calls[2][2].params, { take: 20, page: 1 });
});

test("routes and menus keep HR management exclusive and expose collaborator/public entry points", async () => {
  const [router, nav] = await Promise.all([
    readFile(new URL("../src/routes/AppRouter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/shared/utils/getNavMainItemsByRole.tsx", import.meta.url), "utf8"),
  ]);
  const authApi = await readFile(new URL("../src/api/api.ts", import.meta.url), "utf8");
  const bootstrap = await readFile(new URL("../src/features/auth/hooks/useBootstrapAuth.ts", import.meta.url), "utf8");
  assert.match(router, /window\.location\.pathname\.replace\([\s\S]*?=== "\/buzon"\)[\s\S]*?return <PublicSuggestionPage \/>/);
  assert.match(authApi, /isPublicSuggestion[\s\S]*?!isPublicSuggestion/);
  assert.match(bootstrap, /pathname\.replace\([\s\S]*?=== "\/buzon"\)[\s\S]*?return;/);
  assert.match(router, /allowedRoles=\{\["HR"\]\}[\s\S]*?path="suggestions" element=\{<SuggestionsInboxPage \/>\}/);
  assert.match(router, /allowedRoles=\{\["PSYCHOLOGIST", "INTERNAL", "ADMISSION", "CASHIER"\]\}[\s\S]*?path="suggestions\/new"/);
  assert.doesNotMatch(nav.match(/case "ADMIN":([\s\S]*?)case "ADMISSION":/)?.[1] ?? "", /Buzón de sugerencias/);
  for (const role of ["PSYCHOLOGIST", "INTERNAL", "ADMISSION", "CASHIER"]) assert.match(nav, new RegExp(`case "${role}"`));
  assert.match(nav, /title: "Gestión del buzón"[\s\S]*?url: "\/suggestions"/);
});
