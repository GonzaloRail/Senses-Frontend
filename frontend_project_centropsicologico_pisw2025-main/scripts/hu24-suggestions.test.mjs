import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
async function loadSource(path, mode = "demo") {
  const result = await build({
    absWorkingDir: projectRoot, entryPoints: [path], bundle: true, write: false,
    platform: "node", format: "esm", logLevel: "silent",
    define: { "import.meta.env.VITE_SUGGESTIONS_MODE": JSON.stringify(mode) },
    plugins: [{
      name: "suggestions-dependencies",
      setup(builder) {
        builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({ path: "http", namespace: "mock" }));
        builder.onResolve({ filter: /^@\/store\/auth\/auth.store$/ }, () => ({ path: "auth", namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
          contents: path === "auth" ? "export const getAuth = () => globalThis.hu24Auth;" : "export default { get: (...args) => globalThis.hu24Http.get(...args), post: (...args) => globalThis.hu24Http.post(...args), patch: (...args) => globalThis.hu24Http.patch(...args) };",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const model = await loadSource("src/features/suggestions/suggestions.ts");
const demo = await loadSource("src/features/suggestions/api/suggestionsApi.ts");
const live = await loadSource("src/features/suggestions/api/suggestionsApi.ts", "api");
const nav = await loadSource("src/shared/utils/getNavMainItemsByRole.tsx");
const input = { category: "PROCESSES", message: "  Una idea para mejorar  ", isAnonymous: true };
const user = { id: "employee-1", firstName: "Ana", lastName: "Ejemplo" };
const suggestion = { ...input, message: input.message.trim(), id: "one", status: "NEW", author: null, createdAt: "2026-10-19T14:00:00Z" };

test("validates mandatory category, blank/long message, boolean anonymity and trims/strips payload", () => {
  for (const invalid of [
    { ...input, category: "" }, { ...input, category: "UNKNOWN" },
    { ...input, message: " \n\t " }, { ...input, message: "a".repeat(3001) },
    { ...input, isAnonymous: "true" },
  ]) assert.equal(model.suggestionInputSchema.safeParse(invalid).success, false);
  assert.equal(model.suggestionInputSchema.parse({ ...input, message: "a".repeat(3000) }).message.length, 3000);
  assert.deepEqual(model.suggestionInputSchema.parse({ ...input, authorId: user.id }), { ...input, message: input.message.trim() });
  assert.equal(model.suggestionSchema.parse({ ...suggestion, author: { displayName: "Must not leak" } }).author, null);
});

test("demo supports anonymous/identified creation, all categories, filtering, pagination and status updates without HTTP", async () => {
  globalThis.hu24Http = new Proxy({}, { get: () => () => { throw new Error("Demo must not call HTTP"); } });
  globalThis.hu24Auth = { user, roleSelected: "ADMISSION" };
  const anonymous = await demo.createSuggestionApi({ ...input, authorId: user.id });
  assert.equal(anonymous.author, null);
  assert.equal(anonymous.status, "NEW");
  assert.equal(anonymous.message, input.message.trim());
  const identified = await demo.createSuggestionApi({ ...input, isAnonymous: false });
  assert.deepEqual(identified.author, { displayName: "Ana Ejemplo" });
  globalThis.hu24Auth.roleSelected = "ADMIN";
  for (const category of Object.keys(model.suggestionCategories)) {
    const page = await demo.getSuggestionsApi({ page: 1, category });
    assert.ok(page.items.length);
    assert.ok(page.items.every((item) => item.category === category));
  }
  for (const status of ["READ", "IN_REVIEW", "ARCHIVED"]) {
    assert.equal((await demo.updateSuggestionStatusApi({ id: anonymous.id, status })).status, status);
    const page = await demo.getSuggestionsApi({ page: 1, status });
    assert.ok(page.items.every((item) => item.status === status));
    assert.ok(page.items.some((item) => item.id === anonymous.id));
  }
  await assert.rejects(demo.updateSuggestionStatusApi({ id: "missing", status: "READ" }));
  for (let i = 0; i < 7; i++) await demo.createSuggestionApi(input);
  const first = await demo.getSuggestionsApi({ page: 1 });
  const second = await demo.getSuggestionsApi({ page: 2 });
  assert.equal(first.items.length, 10);
  assert.equal(first.totalPages, 2);
  assert.equal(second.items.length, first.total - 10);
  assert.ok(!second.items.some((item) => first.items.some(({ id }) => id === item.id)));
  assert.equal((await demo.getSuggestionsApi({ page: 1, category: "OTHER", status: "NEW" })).total, 0);
});

test("only manager reads/changes statuses; sender roles and navigation match the protected routes", async () => {
  for (const role of ["PSYCHOLOGIST", "ADMISSION", "CASHIER", "HR", "INTERNAL", "AUDITOR", "PATIENT"]) {
    globalThis.hu24Auth = { user, roleSelected: role };
    await assert.rejects(demo.getSuggestionsApi({ page: 1 }), /Solo Gerencia/);
    await assert.rejects(demo.updateSuggestionStatusApi({ id: "one", status: "READ" }), /Solo Gerencia/);
    const entry = nav.getNavMainItemsByRole(role).find((item) => item.title === "Buzón de sugerencias");
    if (["PSYCHOLOGIST", "ADMISSION", "CASHIER"].includes(role)) {
      assert.equal(entry.url, "/suggestions");
    } else {
      assert.equal(entry, undefined);
      await assert.rejects(demo.createSuggestionApi(input), /no tiene acceso/);
    }
  }
  globalThis.hu24Auth = { user: null, roleSelected: "ADMIN" };
  await assert.rejects(demo.getSuggestionsApi({ page: 1 }));
  await assert.rejects(demo.createSuggestionApi(input));
  assert.equal(nav.getNavMainItemsByRole("ADMIN").find((item) => item.title === "Buzón de sugerencias").url, "/suggestions/received");
  const router = await readFile(new URL("../src/routes/AppRouter.tsx", import.meta.url), "utf8");
  assert.match(router, /allowedRoles=\{\["ADMIN"\]\}[\s\S]*?path="suggestions\/received"/);
  assert.match(router, /allowedRoles=\{\["ADMIN", "PSYCHOLOGIST", "ADMISSION", "CASHIER"\]\}[\s\S]*?path="suggestions"/);
});

test("API mode uses the proposed contract, excludes identity and never falls back on errors", async () => {
  globalThis.hu24Auth = { user, roleSelected: "ADMIN" };
  const calls = [];
  globalThis.hu24Http = {
    post: async (...args) => { calls.push(args); return { data: suggestion }; },
    get: async (...args) => { calls.push(args); return { data: { items: [suggestion], total: 1, page: 1, totalPages: 1 } }; },
    patch: async (...args) => { calls.push(args); return { data: { ...suggestion, status: "READ" } }; },
  };
  assert.equal(live.suggestionsDemoMode, false);
  await live.createSuggestionApi({ ...input, authorId: user.id, email: "private" });
  assert.deepEqual(calls[0], ["/api/v1/suggestions", { ...input, message: input.message.trim() }]);
  const signal = new AbortController().signal;
  await live.getSuggestionsApi({ page: 1, status: "NEW" }, signal);
  assert.deepEqual(calls[1], ["/api/v1/suggestions", { params: { page: 1, status: "NEW", take: 10 }, signal }]);
  await live.updateSuggestionStatusApi({ id: "one/two", status: "READ" });
  assert.deepEqual(calls[2], ["/api/v1/suggestions/one%2Ftwo/status", { status: "READ" }]);
  await assert.rejects(live.updateSuggestionStatusApi({ id: "one", status: "INVALID" }));
  globalThis.hu24Http.post = async () => { throw new Error("Network failed"); };
  await assert.rejects(live.createSuggestionApi(input), /Network failed/);
  globalThis.hu24Http.get = async () => ({ data: { wrongContract: true } });
  await assert.rejects(live.getSuggestionsApi({ page: 1 }));
});
