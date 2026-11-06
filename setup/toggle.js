#!/usr/bin/env node
// Steroids switch.  Usage: node toggle.js on|off|ensure
//   on      start the gateway, test it end to end, then write the env + keep your plugins enabled
//   off     remove the env from settings.json and stop the gateway
//   ensure  start the gateway if it is down (used at session start)
// Test without touching anything real:  DRY=1 SETTINGS=/tmp/settings.json node toggle.js on   (STEROIDS_CONFIG=<file> picks another config)
// Chain: Claude Code -> OmniRoute (routing, fallback, lossless compression) -> providers
const fs = require("fs"), os = require("os"), path = require("path");
const { execSync } = require("child_process");

const M = {
  en: {
    usage: "Usage: node toggle.js on|off|ensure",
    starting: "Starting OmniRoute...",
    running: "OmniRoute is running.",
    noStart: "ERROR: OmniRoute did not start.",
    untouched: " Your configuration was not touched.",
    keyRejected: (s) => `ERROR: the API key was rejected or the test failed (${s}).`,
    on: "Steroids ON (plugins kept enabled). Open a new Claude Code session to use it.",
    off: "Steroids OFF. New Claude Code sessions use the normal connection.",
  },
  es: {
    usage: "Uso: node toggle.js on|off|ensure",
    starting: "Arrancando OmniRoute...",
    running: "OmniRoute en marcha.",
    noStart: "ERROR: OmniRoute no arrancó.",
    untouched: " No toqué tu configuración.",
    keyRejected: (s) => `ERROR: la API key fue rechazada o la prueba falló (${s}).`,
    on: "Steroids ACTIVADO (plugins al día). Abre una sesión nueva de Claude Code para usarlo.",
    off: "Steroids DESACTIVADO. Las sesiones nuevas usan la conexión normal.",
  },
};
const t = M[process.env.STEROIDS_LANG === "es" ? "es" : "en"];

const mode = process.argv[2];
const cfgPath = process.env.STEROIDS_CONFIG || path.join(__dirname, "steroids.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const settingsPath = process.env.SETTINGS || path.join(os.homedir(), ".claude", "settings.json");
const dry = !!process.env.DRY;
const env = {
  ANTHROPIC_BASE_URL: cfg.baseUrl,
  ANTHROPIC_AUTH_TOKEN: cfg.apiKey,
  ANTHROPIC_DEFAULT_OPUS_MODEL: cfg.opus,
  ANTHROPIC_DEFAULT_SONNET_MODEL: cfg.sonnet,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: cfg.haiku,
};

const up = async () => {
  try { await fetch(cfg.baseUrl, { signal: AbortSignal.timeout(3000) }); return true; } catch { return false; }
};
const editSettings = (fn) => {
  const s = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  fs.copyFileSync(settingsPath, settingsPath + ".bak-steroids");
  s.env = s.env || {};
  fn(s);
  fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2));
};
const startServer = async () => {
  if (dry || (await up())) return true;
  console.log(t.starting);
  try { execSync("omniroute serve --daemon --no-open", { stdio: "ignore", shell: true }); } catch { return false; } // omniroute missing or failed
  for (let i = 0; i < 30 && !(await up()); i++) await new Promise((r) => setTimeout(r, 2000));
  return up();
};

(async () => {
  if (mode === "ensure") {
    console.log((await startServer()) ? t.running : t.noStart);
  } else if (mode === "on") {
    if (!(await startServer())) { console.log(t.noStart + t.untouched); process.exit(1); }
    if (!dry) {
      // End-to-end test through the real entry point before touching settings.json
      const r = await fetch(cfg.baseUrl + "/v1/messages", {
        method: "POST", signal: AbortSignal.timeout(90000),
        headers: { Authorization: "Bearer " + cfg.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: cfg.haiku.replace("[1m]", ""), max_tokens: 5, messages: [{ role: "user", content: "hi" }] }),
      }).catch((e) => ({ ok: false, status: e.message }));
      if (!r.ok) { console.log(t.keyRejected(r.status) + t.untouched); process.exit(1); }
    }
    editSettings((s) => {
      Object.assign(s.env, env);
      if ((cfg.plugins || []).length)
        s.enabledPlugins = Object.assign(s.enabledPlugins || {}, Object.fromEntries(cfg.plugins.map((p) => [p, true])));
    });
    console.log(t.on);
  } else if (mode === "off") {
    editSettings((s) => Object.keys(env).forEach((k) => delete s.env[k]));
    if (!dry && !process.env.STEROIDS_SKIP_SERVER) { try { execSync("omniroute stop", { stdio: "ignore", shell: true }); } catch {} } // STEROIDS_SKIP_SERVER=1: leave the gateway running (tests)
    console.log(t.off);
  } else {
    console.log(t.usage);
    process.exit(1);
  }
})();
