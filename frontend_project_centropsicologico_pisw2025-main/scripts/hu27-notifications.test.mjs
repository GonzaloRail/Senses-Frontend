import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const notification = (id, isRead = false) => ({
  id, title: "Aviso " + id, message: "Mensaje", type: "INFO", isRead,
  createdAt: "2026-11-20T12:00:00.000Z",
});
const token = (exp) => "header." + Buffer.from(JSON.stringify({ exp })).toString("base64url") + ".signature";

async function createSession(realApi = false) {
  const sockets = [];
  const requests = [];
  const toasts = [];
  const errors = [];
  const harness = {
    get: async (...args) => { requests.push(args); return { data: { data: [] } }; },
    patch: async () => ({}),
    toast: (...args) => toasts.push(args),
    success: () => {},
    error: (...args) => errors.push(args),
    io: (url, options) => {
      const handlers = new Map();
      const socket = {
        connected: false, active: true, auth: options.auth,
        connects: 0, disconnects: 0,
        on(event, callback) {
          handlers.set(event, [...(handlers.get(event) ?? []), callback]);
          return socket;
        },
        removeAllListeners() { handlers.clear(); },
        disconnect() { socket.disconnects++; socket.connected = false; socket.active = false; },
        connect() { socket.connects++; socket.active = true; },
        fire(event, value) { for (const handler of handlers.get(event) ?? []) handler(value); },
        listenerCount: (event) => (handlers.get(event) ?? []).length,
      };
      sockets.push({ socket, url, options });
      return socket;
    },
  };
  const result = await build({
    absWorkingDir: root,
    stdin: {
      contents: 'export * from "./src/store/auth/auth.store"; export * from "./src/store/notifications/notifications.store"; export * from "./src/lib/socketClient";',
      resolveDir: root,
      loader: "ts",
    },
    bundle: true, write: false, platform: "node", format: "cjs",
    define: { "import.meta.env.VITE_API_URL": '"https://api.test"' },
    plugins: [{
      name: "session-test",
      setup(builder) {
        builder.onResolve({ filter: /^(?:@\/api\/api|socket.io-client|sonner)$/ }, ({ path }) => {
          if (realApi && path === "@/api/api") return undefined;
          return { path, namespace: "mock" };
        });
        builder.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
          loader: "js",
          contents: path === "@/api/api"
            ? 'export const API_BASE_URL="https://api.test"; export default { get: (...args) => harness.get(...args), patch: (...args) => harness.patch(...args) };'
            : path === "socket.io-client"
              ? "export const io = (...args) => harness.io(...args);"
              : "export const toast=Object.assign((...args)=>harness.toast(...args), {success:(...args)=>harness.success(...args),error:(...args)=>harness.error(...args)});",
        }));
      },
    }],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", "harness", result.outputFiles[0].text)(
    createRequire(import.meta.url), module, module.exports, harness,
  );
  return { ...module.exports, harness, sockets, requests, toasts, errors };
}

test("rapid mounts and token renewal reuse one socket, one fetch and one listener", async () => {
  const session = await createSession();
  const { useNotifications, setAuth, clearAuth, sockets, requests, harness } = session;
  const loading = deferred();
  harness.get = async (...args) => { requests.push(args); return loading.promise; };
  try {
    setAuth({ accessToken: "first", user: { id: "user-a" } });
    const work = Array.from({ length: 30 }, () => useNotifications.getState().initSession("first", "user-a"));
    assert.equal(sockets.length, 1);
    assert.equal(requests.length, 1);
    assert.equal(sockets[0].socket.listenerCount("new_notification"), 1);
    setAuth({ accessToken: "renewed" });
    assert.equal(sockets.length, 1);
    assert.deepEqual(sockets[0].socket.auth, { token: "renewed" });
    assert.equal(sockets[0].socket.disconnects, 0);
    assert.equal(requests.length, 1);
    loading.resolve({ data: { data: [notification("saved")] } });
    await Promise.all(work);
    assert.equal(useNotifications.getState().unreadCount, 1);
    clearAuth();
    assert.equal(sockets[0].socket.disconnects, 1);
    assert.equal(useNotifications.getState().unreadCount, 0);
  } finally { clearAuth(); }
});

test("live arrivals survive initial fetch and duplicate events produce one toast", async () => {
  const { useNotifications, harness, sockets, toasts } = await createSession();
  const loading = deferred();
  harness.get = () => loading.promise;
  try {
    const init = useNotifications.getState().initSession("token", "user-a");
    sockets[0].socket.fire("new_notification", notification("live"));
    sockets[0].socket.fire("new_notification", notification("live"));
    loading.resolve({ data: { data: [notification("saved")] } });
    await init;
    assert.deepEqual(new Set(useNotifications.getState().notifications.map((n) => n.id)), new Set(["live", "saved"]));
    assert.equal(toasts.length, 1);
    sockets[0].socket.fire("new_notification", { invalid: true });
    assert.equal(toasts.length, 1);
  } finally { useNotifications.getState().clearSession(); }
});

test("logout cancels loading and late data cannot leak into the next account", async () => {
  const { setAuth, clearAuth, useNotifications, harness, sockets } = await createSession();
  const first = deferred();
  let oldSignal;
  harness.get = (_, config) => { oldSignal = config.signal; return first.promise; };
  setAuth({ accessToken: "a", user: { id: "user-a" } });
  const oldRequest = useNotifications.getState().fetchNotifications();
  clearAuth();
  assert.equal(oldSignal.aborted, true);
  harness.get = async () => ({ data: { data: [notification("user-b-only")] } });
  try {
    setAuth({ accessToken: "b", user: { id: "user-b" } });
    await useNotifications.getState().fetchNotifications();
    first.resolve({ data: { data: [notification("private-user-a")] } });
    await oldRequest;
    assert.deepEqual(useNotifications.getState().notifications.map((n) => n.id), ["user-b-only"]);
    assert.equal(sockets.length, 2);
    assert.equal(sockets[0].socket.listenerCount("new_notification"), 0);
  } finally { clearAuth(); }
});

test("failed reads remain unread, repeated clicks share a request and new arrivals remain unread", async () => {
  const { useNotifications, harness, sockets, errors } = await createSession();
  harness.get = async () => ({ data: { data: [notification("saved")] } });
  try {
    await useNotifications.getState().initSession("token", "user-a");
    harness.patch = async () => { throw new Error("Network failed"); };
    await useNotifications.getState().markAsRead("saved");
    await useNotifications.getState().markAllAsRead();
    assert.equal(useNotifications.getState().unreadCount, 1);
    assert.equal(errors.length, 2);
    let calls = 0;
    const marking = deferred();
    harness.patch = () => { calls++; return marking.promise; };
    const read = useNotifications.getState().markAsRead("saved");
    await useNotifications.getState().markAsRead("saved");
    assert.equal(calls, 1);
    marking.resolve({});
    await read;
    assert.equal(useNotifications.getState().unreadCount, 0);
    const markAll = deferred();
    harness.patch = () => markAll.promise;
    const all = useNotifications.getState().markAllAsRead();
    sockets[0].socket.fire("new_notification", notification("arrived-during-request"));
    markAll.resolve({});
    await all;
    assert.equal(useNotifications.getState().unreadCount, 1);
  } finally { useNotifications.getState().clearSession(); }
});

test("reconnect catches up once while navigation never forces a retry", async () => {
  const { useNotifications, sockets, requests } = await createSession();
  try {
    await useNotifications.getState().initSession("token", "user-a");
    const { socket, options } = sockets[0];
    assert.equal(options.reconnectionAttempts, 5);
    assert.equal(options.reconnectionDelay, 1000);
    assert.equal(options.reconnectionDelayMax, 5000);
    assert.equal(options.tryAllTransports, true);
    socket.fire("connect");
    assert.equal(requests.length, 1);
    socket.fire("connect");
    await useNotifications.getState().fetchNotifications();
    assert.equal(requests.length, 2);
    socket.active = false;
    await useNotifications.getState().initSession("token", "user-a");
    assert.equal(socket.connects, 0);
    assert.equal(sockets.length, 1);
  } finally { useNotifications.getState().clearSession(); }
});

test("token expiry disconnects even when modules are not mounted; renewal replaces the deadline", async (context) => {
  const { setAuth, clearAuth, useNotifications, sockets } = await createSession();
  const now = Date.now();
  context.mock.timers.enable({ apis: ["Date", "setTimeout"], now });
  try {
    setAuth({ accessToken: token(Math.floor(now / 1000) + 2), user: { id: "user-a" } });
    await useNotifications.getState().fetchNotifications();
    setAuth({ accessToken: token(Math.floor(now / 1000) + 10) });
    context.mock.timers.tick(2500);
    assert.equal(sockets[0].socket.disconnects, 0);
    context.mock.timers.tick(10_000);
    assert.equal(sockets[0].socket.disconnects, 1);
    assert.equal(useNotifications.getState().isInitialized, false);
    assert.equal(useNotifications.getState().notifications.length, 0);
  } finally { clearAuth(); context.mock.timers.reset(); }
});

test("token null without explicit logout still clears the socket", async () => {
  const { setAuth, clearAuth, useNotifications, sockets } = await createSession();
  try {
    setAuth({ accessToken: "token", user: { id: "user-a" } });
    await useNotifications.getState().fetchNotifications();
    setAuth({ accessToken: null, user: null });
    assert.equal(sockets[0].socket.disconnects, 1);
    assert.equal(useNotifications.getState().isInitialized, false);
  } finally { clearAuth(); }
});

test("real auth, API and notification import graph initializes without circular dependency failures", async () => {
  const { useAuth, useNotifications, getSocket, sockets, clearAuth } = await createSession(true);
  try {
    assert.equal(useAuth.getState().accessToken, null);
    assert.equal(useNotifications.getState().isInitialized, false);
    assert.equal(getSocket(), null);
    assert.equal(sockets.length, 0);
  } finally { clearAuth(); }
});
