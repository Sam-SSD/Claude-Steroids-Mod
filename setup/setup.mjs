#!/usr/bin/env node
// Steroids setup.   node setup/setup.mjs <install|combos|compression> [options]
//   install              copy the switch to ~/.claude/steroids, install the plugin, optional CLAUDE.md block + attribution
//   combos               create steroids-opus/sonnet/haiku in OmniRoute from the chains in steroids.json, test them, turn compression on
//   compression on|off   apply the lossless compression preset, or restore what OmniRoute had before
// Options: --yes (no questions)  --dry (print, change nothing)  --with=ponytail,frontend-design,mempalace  --source=<local repo path>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const [cmd, sub] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flag = (n) => process.argv.some((a) => a === `--${n}`);
const opt = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1];
const dry = flag("dry"), yes = flag("yes");

const claudeDir = path.join(os.homedir(), ".claude");
const dataDir = path.join(claudeDir, "steroids");
const cfgFile = path.join(dataDir, "steroids.json");
const say = (s = "") => console.log(s);
const sh = (line, env = {}) => execSync(line, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } });
const tryOk = (line, env) => { try { sh(line, env); return true; } catch { return false; } };
const act = (what, fn) => { say(`${dry ? "[dry] " : ""}${what}`); if (!dry) fn(); };
const ask = async (q) => {
  if (yes) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`${q} [y/N] `)).trim().toLowerCase();
  rl.close();
  return a === "y" || a === "yes" || a === "s" || a === "si";
};
const backup = (f) => fs.existsSync(f) && fs.copyFileSync(f, f + ".bak-steroids");
const readCfg = () => {
  if (!fs.existsSync(cfgFile)) throw new Error(`Missing ${cfgFile}. Run: node setup/setup.mjs install`);
  const c = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  if (!c.apiKey || c.apiKey.startsWith("PASTE")) throw new Error(`Put your OmniRoute API key in ${cfgFile} first (dashboard -> API Keys).`);
  return c;
};
const api = (c, p, init = {}) =>
  fetch(c.baseUrl + p, { ...init, headers: { Authorization: "Bearer " + c.apiKey, "content-type": "application/json", "anthropic-version": "2023-06-01", ...init.headers } });

// ---------- install ----------
async function install() {
  const [maj, min, pat] = process.versions.node.split(".").map(Number);
  if (!(maj >= 24 || (maj === 22 && (min > 22 || (min === 22 && pat >= 2))))) throw new Error(`Node ${process.versions.node} is too old: OmniRoute needs 22.22.2+ (or 24+).`);
  say(`1/6 Node ${process.versions.node} OK`);

  if (tryOk("omniroute -v")) say("2/6 OmniRoute already installed");
  else if (await ask("2/6 OmniRoute is not installed. Run 'npm i -g omniroute'?")) act("npm i -g omniroute", () => sh("npm i -g omniroute"));
  else say("2/6 skipped: install it yourself with: npm i -g omniroute");

  act(`3/6 copy the switch to ${dataDir}`, () => {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(path.join(here, "toggle.js"), path.join(dataDir, "toggle.js"));
    if (!fs.existsSync(cfgFile)) fs.copyFileSync(path.join(here, "steroids.example.json"), cfgFile);
  });

  const source = opt("source") || "Sam-SSD/Claude-Steroids-Mod";
  const withList = (opt("with") || "").split(",").filter(Boolean);
  const pluginIds = [];
  const extra = {
    ponytail: ["DietrichGebert/ponytail", "ponytail@ponytail"],
    "frontend-design": [null, "frontend-design@claude-plugins-official"],
    mempalace: ["milla-jovovich/mempalace", "mempalace@mempalace"],
  };
  act("4/6 install the steroids plugin", () => {
    sh(`claude plugin marketplace add "${source}"`);
    sh("claude plugin install steroids@claude-steroids --scope user");
  });
  for (const name of withList) {
    const [market, id] = extra[name] || [];
    if (!id) { say(`   unknown plugin '${name}' (skipped)`); continue; }
    act(`   install ${id}`, () => {
      if (name === "mempalace") sh("python -m pip install mempalace");
      if (market) sh(`claude plugin marketplace add ${market}`);
      sh(`claude plugin install ${id} --scope user`);
    });
    pluginIds.push(id);
  }
  if (pluginIds.length && !dry) {
    const c = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
    c.plugins = [...new Set([...(c.plugins || []), ...pluginIds])];
    fs.writeFileSync(cfgFile, JSON.stringify(c, null, 2));
  }

  const md = path.join(claudeDir, "CLAUDE.md");
  if (await ask("5/6 Add the 'use your plugins' block to ~/.claude/CLAUDE.md?")) {
    act(`   write the block in ${md} (backup: CLAUDE.md.bak-steroids)`, () => {
      const block = fs.readFileSync(path.join(repo, "examples", "claude-md.snippet.md"), "utf8").trim();
      const cur = fs.existsSync(md) ? fs.readFileSync(md, "utf8") : "";
      backup(md);
      const re = /<!-- steroids:plugins[\s\S]*?<!-- \/steroids:plugins -->/;
      fs.writeFileSync(md, (re.test(cur) ? cur.replace(re, block) : cur.trimEnd() + "\n\n" + block).trimStart() + "\n");
    });
  } else say("   skipped");

  const sf = path.join(claudeDir, "settings.json");
  if (await ask("6/6 Stop Claude from adding 'Co-Authored-By' to your commits (attribution.commit = \"\")?")) {
    act(`   edit ${sf} (backup: settings.json.bak-steroids)`, () => {
      const s = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, "utf8")) : {};
      backup(sf);
      s.attribution = { ...s.attribution, commit: "" };
      fs.writeFileSync(sf, JSON.stringify(s, null, 2));
    });
  } else say("   skipped");

  say(`
Done. Now, by hand (these need your accounts, I cannot do them for you):
  1. omniroute serve --daemon           # dashboard at http://localhost:20128
  2. In the dashboard connect your providers (Claude, Gemini, Copilot...) and create an API key.
  3. Paste the key in ${cfgFile} ("apiKey").
  4. node setup/setup.mjs combos        # creates steroids-opus/sonnet/haiku, tests them, turns compression on
  5. In Claude Code:  /steroids on      # then open a new session`);
}

// ---------- compression ----------
async function compression(state) {
  const c = readCfg();
  const saved = path.join(dataDir, "compression-original.json");
  const cur = await (await api(c, "/api/settings/compression")).json();
  let body;
  if (state === "on") {
    if (!fs.existsSync(saved)) act(`save the current compression settings to ${saved}`, () => fs.writeFileSync(saved, JSON.stringify(cur, null, 2)));
    const keep = ["session-dedup", "lite", "rtk", "headroom"]; // lossless only
    const engines = Object.fromEntries(Object.keys(cur.engines).map((k) => [k, { ...cur.engines[k], enabled: keep.includes(k) }]));
    engines.rtk = { enabled: true, level: "standard" };
    body = { ...cur, enabled: true, defaultMode: "stacked", stackedPipeline: [{ engine: "rtk", intensity: "standard" }, { engine: "headroom" }], engines, rtkConfig: { ...cur.rtkConfig, enabled: true, intensity: "standard" }, cavemanConfig: { ...cur.cavemanConfig, enabled: false } };
  } else {
    body = fs.existsSync(saved) ? JSON.parse(fs.readFileSync(saved, "utf8")) : { ...cur, enabled: false, defaultMode: "off" };
  }
  act(`compression ${state}`, () => {});
  if (!dry) {
    const r = await api(c, "/api/settings/compression", { method: "PUT", body: JSON.stringify(body) });
    const j = await r.json();
    say(`   HTTP ${r.status}: enabled=${j.enabled} mode=${j.defaultMode} engines=${Object.entries(j.engines || {}).filter(([, e]) => e.enabled).map(([k]) => k).join("+")}`);
  }
}

// ---------- combos ----------
async function combos() {
  const c = readCfg();
  for (const role of ["opus", "sonnet", "haiku"]) {
    const name = c[role].replace("[1m]", "");
    const models = (c.chains?.[role] || []).map((m) => `--model ${m}`).join(" ");
    if (!models) throw new Error(`steroids.json has no chain for '${role}'`);
    act(`combo ${name}: ${c.chains[role].join(" -> ")}`, () => {
      const env = { OMNIROUTE_API_KEY: c.apiKey };
      tryOk(`omniroute combo delete ${name} --yes`, env);
      sh(`omniroute combo create ${name} --strategy priority ${models}`, env);
    });
    if (!dry) {
      const r = await api(c, "/v1/messages", { method: "POST", body: JSON.stringify({ model: name, max_tokens: 10, messages: [{ role: "user", content: "hi" }] }) });
      const j = await r.json();
      say(`   test ${name}: ${r.ok ? "answered with " + j.model : "FAILED " + JSON.stringify(j.error || j).slice(0, 160)}`);
    }
  }
  await compression("on");
}

try {
  if (cmd === "install") await install();
  else if (cmd === "combos") await combos();
  else if (cmd === "compression" && (sub === "on" || sub === "off")) await compression(sub);
  else say("Usage: node setup/setup.mjs <install|combos|compression on|off> [--yes] [--dry] [--with=ponytail,frontend-design,mempalace] [--source=<path>]");
} catch (e) {
  console.error("ERROR: " + e.message);
  process.exit(1);
}
