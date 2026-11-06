#!/usr/bin/env node
// Renders the README art from assets/src/*.html with headless Chrome + ffmpeg (no other dependencies).
//   node assets/render.mjs banner            -> assets/banner.png and assets/social-preview.png (1280x640)
//   node assets/render.mjs gifs [name]       -> assets/demo-*.gif (all, or just one)
//   node assets/render.mjs frame <page> <t>  -> assets/src/_frame.png (one frame at time t in 0..1, for previews)
// Needs Google Chrome (set CHROME=<path> if it is not in the default place) and ffmpeg on PATH.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), "src");
const out = path.resolve(src, "..");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const shot = (page, png, w, h, query = "") => {
  const before = fs.existsSync(png) ? fs.statSync(png).mtimeMs : 0;
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--virtual-time-budget=300",
    `--window-size=${w},${h}`, `--screenshot=${png}`, pathToFileURL(path.join(src, page)).href + query], { stdio: "ignore" });
  // Chrome exits 0 even when it cannot write (e.g. the PNG is open in an image viewer): check the file really changed
  if (!fs.existsSync(png) || fs.statSync(png).mtimeMs <= before) throw new Error(`Chrome did not write ${png} (is it open in another program?)`);
};

function gif(name, { frames = 48, fps = 16, hold = 14 } = {}) {
  const dir = path.join(src, "_frames", name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < frames; i++) shot(`${name}.html`, path.join(dir, `f${String(i).padStart(3, "0")}.png`), 800, 450, `?t=${(i / (frames - 1)).toFixed(4)}`);
  for (let i = 0; i < hold; i++) fs.copyFileSync(path.join(dir, `f${String(frames - 1).padStart(3, "0")}.png`), path.join(dir, `f${String(frames + i).padStart(3, "0")}.png`));
  const pal = path.join(dir, "pal.png"), target = path.join(out, `${name}.gif`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "f%03d.png"), "-vf", "palettegen=stats_mode=diff", pal]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "f%03d.png"), "-i", pal, "-lavfi", "paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", target]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`${name}.gif  ${(fs.statSync(target).size / 1024).toFixed(0)} KB`);
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === "banner") {
  shot("banner.html", path.join(out, "banner.png"), 1280, 640);
  fs.copyFileSync(path.join(out, "banner.png"), path.join(out, "social-preview.png"));
  console.log(`banner.png ${(fs.statSync(path.join(out, "banner.png")).size / 1024).toFixed(0)} KB`);
} else if (cmd === "gifs") {
  for (const n of ["demo-toggle", "demo-fallback", "demo-compression"]) if (!a || a === n) gif(n);
  fs.rmSync(path.join(src, "_frames"), { recursive: true, force: true });
} else if (cmd === "frame") {
  shot(`${a}.html`, path.join(src, "_frame.png"), 800, 450, `?t=${b}`);
  console.log("wrote assets/src/_frame.png");
} else console.log("Usage: node assets/render.mjs banner | gifs | frame <page> <t>");
