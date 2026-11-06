#!/usr/bin/env node
// Smoke test, no Claude Code or OmniRoute needed. It runs the real switch and the real installer against a mock gateway.
//   node test/smoke.mjs        (CI runs it on Windows, macOS and Linux)
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "steroids-smoke-"));
const KEY = "test-key";
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log("ok  " + name); };

// a tiny gateway: answers the Anthropic-style endpoint when the key is right
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/v1/messages") {
    if (req.headers.authorization !== `Bearer ${KEY}`) { res.writeHead(401); return res.end("{}"); }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ type: "message", model: "mock", content: [{ type: "text", text: "hi" }] }));
  }
  res.writeHead(200); res.end("ok");
});
await new Promise((r) => server.listen(0, r));
const baseUrl = `http://localhost:${server.address().port}`;

const write = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2));
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const cfg = (key) => ({ baseUrl, apiKey: key, opus: "steroids-opus[1m]", sonnet: "steroids-sonnet[1m]", haiku: "steroids-haiku[1m]", plugins: ["demo@market"] });
// async on purpose: the mock gateway lives in this process, so a blocking spawnSync would starve it
const toggle = (mode, settings, config) => new Promise((resolve) => {
  const p = spawn(process.execPath, [path.join(root, "setup", "toggle.js"), mode], {
    env: { ...process.env, SETTINGS: settings, STEROIDS_CONFIG: config, STEROIDS_SKIP_SERVER: "1", STEROIDS_LANG: "en" },
  });
  let stdout = "", stderr = "";
  p.stdout.on("data", (d) => (stdout += d)); p.stderr.on("data", (d) => (stderr += d));
  const timer = setTimeout(() => p.kill(), 60000);
  p.on("close", (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
});

const settingsFile = path.join(tmp, "settings.json"), good = path.join(tmp, "good.json"), bad = path.join(tmp, "bad.json");
write(good, cfg(KEY)); write(bad, cfg("wrong-key"));

try {
  // 1. a wrong key must leave settings.json untouched
  write(settingsFile, { language: "English", env: { KEEP: "1" } });
  let r = await toggle("on", settingsFile, bad);
  check("on with a wrong key exits 1 because the key was rejected", () => { assert.equal(r.status, 1, r.stdout + r.stderr); assert.match(r.stdout, /rejected/i); });
  check("on with a wrong key leaves settings untouched", () => assert.deepEqual(read(settingsFile), { language: "English", env: { KEEP: "1" } }));

  // 2. a right key switches everything on
  r = await toggle("on", settingsFile, good);
  const on = read(settingsFile);
  check("on exits 0", () => assert.equal(r.status, 0, r.stdout + r.stderr));
  check("on writes the gateway and the three models", () => {
    assert.equal(on.env.ANTHROPIC_BASE_URL, baseUrl);
    assert.equal(on.env.ANTHROPIC_AUTH_TOKEN, KEY);
    assert.equal(on.env.ANTHROPIC_DEFAULT_OPUS_MODEL, "steroids-opus[1m]");
    assert.equal(on.env.ANTHROPIC_DEFAULT_SONNET_MODEL, "steroids-sonnet[1m]");
    assert.equal(on.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, "steroids-haiku[1m]");
  });
  check("on keeps your own settings and enables your plugins", () => { assert.equal(on.env.KEEP, "1"); assert.equal(on.language, "English"); assert.equal(on.enabledPlugins["demo@market"], true); });
  check("on writes a backup", () => assert.ok(fs.existsSync(settingsFile + ".bak-steroids")));

  // 3. off removes only what on added
  r = await toggle("off", settingsFile, good);
  const off = read(settingsFile);
  check("off exits 0", () => assert.equal(r.status, 0, r.stdout + r.stderr));
  check("off removes the gateway variables and keeps the rest", () => {
    assert.deepEqual(Object.keys(off.env), ["KEEP"]);
    assert.equal(off.enabledPlugins["demo@market"], true);
  });

  // 4. ensure finds the running gateway
  r = await toggle("ensure", settingsFile, good);
  check("ensure sees the running gateway", () => assert.match(r.stdout, /running/i));

  // 5. the installer, dry run, with a throw-away home (touches nothing)
  const home = path.join(tmp, "home"); fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
  r = spawnSync(process.execPath, [path.join(root, "setup", "setup.mjs"), "install", "--yes", "--dry", "--with=ponytail,frontend-design"], {
    encoding: "utf8", timeout: 60000, env: { ...process.env, HOME: home, USERPROFILE: home },
  });
  check("installer dry run exits 0", () => assert.equal(r.status, 0, r.stdout + r.stderr));
  check("installer dry run changes nothing", () => assert.deepEqual(fs.readdirSync(path.join(home, ".claude")), []));

  // 6. every JSON the repo ships parses, and the example config is complete
  check("shipped JSON files parse", () => {
    for (const f of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", "hooks/hooks.json", "setup/steroids.example.json", "examples/settings.snippet.json"]) read(path.join(root, f));
  });
  check("the example config has the three chains", () => {
    const c = read(path.join(root, "setup", "steroids.example.json"));
    for (const k of ["opus", "sonnet", "haiku"]) assert.ok(c.chains[k].length >= 2, `chain ${k}`);
  });
  console.log(`\n${passed} checks passed on ${process.platform} / node ${process.version}`);
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
