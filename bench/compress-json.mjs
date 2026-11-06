#!/usr/bin/env node
// Reproduces the README compression claim.
//   node setup/setup.mjs compression off && node bench/compress-json.mjs
//   node setup/setup.mjs compression on  && node bench/compress-json.mjs
// It sends a 600-row JSON tool result (the kind of thing an API call or a DB query returns) through your
// gateway and prints the input tokens Claude billed, plus whether a needle hidden in the data survived.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".claude", "steroids", "steroids.json"), "utf8"));
const model = (process.argv[2] || cfg.haiku).replace("[1m]", "");

const rows = [];
for (let i = 0; i < 600; i++)
  rows.push({ id: i, user: "user" + i, status: "ok", latency_ms: 100 + ((i * 7) % 90), region: ["us-east", "eu-west", "sa-east"][i % 3], note: "request completed with no incidents" });
rows[437].status = "error";
rows[437].error_code = "E-7Q4X-92"; // the needle

const messages = [
  { role: "user", content: "Analyse." },
  { role: "assistant", content: [{ type: "text", text: "Running." }, { type: "tool_use", id: "toolu_01", name: "Bash", input: { command: "curl -s localhost:3000/api/requests" } }] },
  { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_01", content: JSON.stringify(rows) }, { type: "text", text: "What is the error_code of the single record whose status is error? Answer with the code only." }] },
];

const r = await fetch(cfg.baseUrl + "/v1/messages", {
  method: "POST",
  headers: { Authorization: "Bearer " + cfg.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
  body: JSON.stringify({ model, max_tokens: 400, messages }),
});
const j = await r.json();
if (j.error) { console.error("ERROR", JSON.stringify(j.error)); process.exit(1); }
const u = j.usage;
const tokens = u.input_tokens + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
const text = (j.content || []).find((b) => b.type === "text")?.text?.trim() ?? "(no text)";
console.log(`model=${j.model}  input_tokens=${tokens}  needle_recovered=${text.includes("E-7Q4X-92")}  answer=${JSON.stringify(text.slice(0, 40))}`);
