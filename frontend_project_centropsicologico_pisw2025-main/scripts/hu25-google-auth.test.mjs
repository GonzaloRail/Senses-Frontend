import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const googleHttpMock = {
  name: "hu25-google-auth-http",
  setup(builder) {
    builder.onResolve({ filter: /^@\/api\/api$/ }, () => ({
      path: "shared-api",
      namespace: "hu25-google-auth",
    }));
    builder.onResolve({ filter: /^axios$/ }, () => ({
      path: "axios",
      namespace: "hu25-google-auth",
    }));
    builder.onLoad({ filter: /.*/, namespace: "hu25-google-auth" }, (args) => {
      if (args.path === "shared-api") {
        return {
          contents: 'export const API_BASE_URL = "https://senses-api.test"; export default { post: () => { throw new Error("Google auth must use its isolated client") } };',
          loader: "js",
        };
      }
      if (args.path !== "axios") return null;
      return {
        contents: `export default {
          create: (config) => {
            globalThis.hu25GoogleConfig = config;
            return { post: (...args) => globalThis.hu25GoogleHttp(...args) };
          }
        };`,
        loader: "js",
      };
    });
  },
};

const loadAuthApi = async () => {
  const result = await build({
    absWorkingDir: projectRoot,
    entryPoints: ["src/features/auth/api/authApi.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [googleHttpMock],
    logLevel: "silent",
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(
    require,
    module,
    module.exports,
  );
  return module.exports;
};

test("Google OAuth nonce request uses the backend contract and includes cookies", async () => {
  const requests = [];
  globalThis.hu25GoogleHttp = async (...args) => {
    requests.push(args);
    return { data: { nonce: "server-nonce" } };
  };

  const authApi = await loadAuthApi();
  assert.equal(await authApi.requestGoogleLoginNonce(), "server-nonce");
  assert.deepEqual(requests, [["/auth/google/nonce", {}]]);
  assert.equal(globalThis.hu25GoogleConfig.baseURL, "https://senses-api.test");
  assert.equal(globalThis.hu25GoogleConfig.withCredentials, true);
  assert.equal(globalThis.hu25GoogleConfig.headers["Content-Type"], "application/json");
});

test("Google credential is posted only to the Google login endpoint", async () => {
  const requests = [];
  globalThis.hu25GoogleHttp = async (...args) => {
    requests.push(args);
    return { data: { user: { id: "user-1" }, token: "senses-access-token" } };
  };

  const authApi = await loadAuthApi();
  const response = await authApi.googleLoginApi("google-id-token");
  assert.deepEqual(requests, [["/auth/google", { credential: "google-id-token" }]]);
  assert.deepEqual(response, { user: { id: "user-1" }, token: "senses-access-token" });
});
