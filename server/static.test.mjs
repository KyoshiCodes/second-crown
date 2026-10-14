import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createStaticServer, staticPath, OUTSIDE_APP } from "./static.mjs";
import { createRealmClocks } from "./realmclock.mjs";
import { createJoinableHolds } from "./join.mjs";

// A temp tree: dist/ is the built app; everything beside it stands in for source, docs, server files.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sc-static-"));
const dist = path.join(tmp, "dist");
fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
fs.writeFileSync(path.join(dist, "index.html"), "<html>app</html>");
fs.writeFileSync(path.join(dist, "assets", "main.js"), "console.log('app')");
fs.mkdirSync(path.join(tmp, "dist-secret"));
fs.writeFileSync(path.join(tmp, "dist-secret", "x.txt"), "sibling secret");
fs.mkdirSync(path.join(tmp, "server"));
fs.writeFileSync(path.join(tmp, "server", "index.mjs"), "server source");
fs.writeFileSync(path.join(tmp, "secret.txt"), "outside");

// Wraps fs so the test sees every path the server touches.
function watchedFs() {
  const touched = [];
  const spy = (name) => (p, ...rest) => { touched.push(path.resolve(String(p))); return fs[name](p, ...rest); };
  return {
    touched,
    fs: { existsSync: spy("existsSync"), statSync: spy("statSync"), readFileSync: spy("readFileSync"), realpathSync: spy("realpathSync") },
  };
}
function fakeRes() {
  return {
    status: 0, headers: null, body: null,
    writeHead(code, headers) { this.status = code; this.headers = headers; },
    end(body) { this.body = body === undefined ? "" : String(body); },
  };
}
const json = (res, code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
function request(urlPath) {
  const w = watchedFs();
  const serve = createStaticServer({ dist, fs: w.fs });
  const res = fakeRes();
  const handled = serve(urlPath, res, json);
  return { handled, res, touched: w.touched };
}
const root = path.resolve(dist);
const insideDist = (p) => p === root || p.startsWith(root + path.sep);

const escapes = [
  "/../secret.txt",
  "/%2e%2e/secret.txt",
  "/..%2fsecret.txt",
  "/..%5csecret.txt",
  "/assets/../../secret.txt",
  "/assets/%2e%2e%2f%2e%2e%2fserver%2findex.mjs",
  "/..%2fdist-secret%2fx.txt",
  "/..%5cdist-secret%5cx.txt",
  "//etc/passwd",
  "/%2fetc%2fpasswd",
  "/C:/Windows/win.ini",
  "/c:%5cWindows%5cwin.ini",
  "/%5c%5cserver%5cshare",
  "/" + encodeURIComponent(path.join(tmp, "secret.txt")),
  "/index.html%00.js",
  "/..",
];

test("a request that tries to leave the built app is refused and reads nothing outside it", () => {
  for (const url of escapes) {
    const { handled, res, touched } = request(url);
    assert.equal(handled, true, url);
    assert.equal(res.status, 403, url);
    assert.deepEqual(JSON.parse(res.body), { error: OUTSIDE_APP }, url);
    assert.deepEqual(touched, [], `${url} touched ${touched}`);
  }
});

test("staticPath never resolves outside dist", () => {
  for (const url of escapes) assert.equal(staticPath(dist, url).refused, true, url);
  assert.equal(staticPath(dist, "/%E0%A4%A").bad, true);
});

test("a bad percent-escape is 400, not a read", () => {
  const { res, touched } = request("/%E0%A4%A");
  assert.equal(res.status, 400);
  assert.deepEqual(touched, []);
});

test("a symlink inside dist that points outside is refused", (t) => {
  const link = path.join(dist, "leak.txt");
  try { fs.symlinkSync(path.join(tmp, "secret.txt"), link); } catch { return t.skip("no symlink permission"); }
  try {
    const { res, touched } = request("/leak.txt");
    assert.equal(res.status, 403);
    assert.ok(!res.body.includes("outside"));
    assert.ok(!touched.some((p) => p === path.resolve(tmp, "secret.txt")));
  } finally {
    fs.unlinkSync(link);
  }
});

test("a normal app request still succeeds", () => {
  for (const url of ["/", "/index.html", "/?x=1"]) {
    const { res, touched } = request(url);
    assert.equal(res.status, 200, url);
    assert.equal(res.body, "<html>app</html>");
    assert.ok(touched.every(insideDist));
  }
  const js = request("/assets/main.js");
  assert.equal(js.res.status, 200);
  assert.match(js.res.headers["Content-Type"], /javascript/);
  assert.equal(js.res.body, "console.log('app')");
  assert.ok(js.touched.every(insideDist));
});

test("a page route inside the app still gets index.html", () => {
  for (const url of ["/realm/oak-hill", "/assets", "/watch/abc"]) {
    const { res, touched } = request(url);
    assert.equal(res.status, 200, url);
    assert.equal(res.body, "<html>app</html>");
    assert.ok(touched.every(insideDist));
  }
});

test("no built app: the caller answers 404, and escapes are still refused", () => {
  const serve = createStaticServer({ dist: path.join(tmp, "missing") });
  assert.equal(serve("/", fakeRes(), json), false);
  const res = fakeRes();
  assert.equal(serve("/../secret.txt", res, json), true);
  assert.equal(res.status, 403);
});

test("a solo load does not join: static requests make no hold and load no sim", async () => {
  let loads = 0;
  const clocks = createRealmClocks(() => 100_000);
  const { holds } = createJoinableHolds({ clocks, loadSim: async () => { loads++; return {}; } });
  request("/");
  request("/assets/main.js");
  for (const id of ["guest_alice", "player"]) assert.equal(await holds.read(id), null);
  assert.equal(holds.size, 0);
  assert.equal(loads, 0);
});

test("the server wires the static gate and keeps no copy of the old check", () => {
  const src = fs.readFileSync(new URL("./index.mjs", import.meta.url), "utf8");
  assert.match(src, /createStaticServer\(\{ dist: DIST \}\)/);
  assert.doesNotMatch(src, /tryStatic|startsWith\(path\.normalize\(DIST\)\)/);
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
