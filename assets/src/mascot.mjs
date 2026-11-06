// Steroids mascot - "Buff Claude": the orange Claude Code critter (block body, two square black eyes, side arms, four legs) on steroids.
// Original pixel-art drawing, an homage. node assets/src/mascot.mjs [1|2|3]  ->  assets/src/mascot.svg (1 = double biceps, 2 = overhead press, 3 = super mode with no mouth, like the original; default 3)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const C = { O: "#D17354", Dk: "#A3492C", Lt: "#E49F89", K: "#14100E", W: "#FFFFFF", Gr: "#C3CAD2", Gd: "#6B7280", Rd: "#E5484D", Rdd: "#A31D23", Y: "#FFD60A", Sweat: "#60A5FA" };
const W = 56, H = 44;
function sprite(draw) {
  const out = [];
  const r = (x, y, w, h, c, o) => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C[c] || c}"${o ? ` opacity="${o}"` : ""}/>`);
  const both = (x, y, w, h, c, o) => { r(x, y, w, h, c, o); r(W - x - w, y, w, h, c, o); };
  draw(r, both);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 10}" height="${H * 10}" shape-rendering="crispEdges">\n${out.join("\n")}\n</svg>\n`;
}
const sparkles = (r, pts) => pts.forEach(([x, y]) => { r(x, y - 1, 1, 3, "Y"); r(x - 1, y, 3, 1, "Y"); });

// the character itself: block body, eyes, angry brows, gritted teeth, pecs, bolt, four legs
function body(r, both, mouth = true) {
  // legs: two pairs, wider gap in the middle, like the original
  both(15, 30, 5, 10, "O"); both(21, 30, 5, 10, "O"); both(15, 38, 5, 2, "Dk"); both(21, 38, 5, 2, "Dk"); both(15, 30, 1, 8, "Dk");
  // block body
  r(14, 4, 28, 26, "O"); r(14, 4, 28, 1, "Lt"); r(41, 5, 1, 25, "Dk"); r(14, 29, 28, 1, "Dk");
  // square black eyes (the signature) + a glint
  both(19, 8, 4, 4, "K"); both(19, 8, 1, 1, "W");
  // angry brows
  both(18, 6, 3, 1, "Dk"); both(20, 7, 3, 1, "Dk");
  // gritted teeth
  if (mouth) { r(22, 18, 12, 5, "K"); r(23, 18, 10, 4, "W"); r(27, 18, 1, 4, "K"); r(25, 18, 1, 4, "K"); r(30, 18, 1, 4, "K"); r(22, 20, 12, 1, "K"); }
  // pecs and abs: two columns of squares (the vertical divider and one row at the bottom)
  r(17, 28, 10, 1, "Dk"); r(30, 28, 10, 1, "Dk"); r(17, 24, 10, 1, "Lt", .5); r(30, 24, 10, 1, "Lt", .5);
  if (mouth) r(28, 24, 1, 6, "Dk");
  else { // no mouth: the empty chest gets a second row of squares above, like abs
    r(28, 18, 1, 12, "Dk"); r(17, 23, 10, 1, "Dk"); r(30, 23, 10, 1, "Dk"); r(17, 18, 10, 1, "Lt", .5); r(30, 18, 10, 1, "Lt", .5);
  }
  // bolt on the chest
  r(36, 24, 3, 1, "Y"); r(35, 25, 3, 1, "Y"); r(34, 26, 4, 1, "Y"); r(36, 27, 2, 1, "Y"); r(35, 28, 1, 1, "Y");
}
// double-biceps arm (left; mirrored by `both`)
function flexArm(both) {
  both(3, 18, 12, 6, "O"); both(3, 23, 12, 1, "Dk");              // upper arm out of the shoulder
  both(7, 13, 8, 5, "O"); both(8, 14, 3, 2, "Lt"); both(14, 13, 1, 5, "Dk"); // the biceps peak
  both(3, 6, 7, 12, "O"); both(3, 6, 1, 12, "Dk");                // forearm up
  both(2, 2, 9, 5, "Lt"); both(2, 2, 9, 1, "O");                   // fist
}

const V = {};

// 1 — double biceps
V["1"] = sprite((r, both) => {
  body(r, both); flexArm(both);
  r(5, 9, 1, 4, "Dk"); r(50, 9, 1, 4, "Dk");                       // veins
  r(12, 10, 1, 2, "Sweat"); r(43, 8, 1, 2, "Sweat");
  sparkles(r, [[1, 14], [54, 14], [6, 31], [49, 31]]);
});

// 2 — overhead press
V["2"] = sprite((r, both) => {
  both(0, 0, 4, 12, "Rd"); both(0, 0, 1, 12, "Rdd"); both(3, 0, 1, 12, "Rdd"); both(4, 2, 2, 8, "Gr"); both(4, 2, 1, 8, "Gd");
  r(6, 4, 44, 3, "Gr"); r(6, 6, 44, 1, "Gd");
  body(r, both);
  // arms straight up to the bar
  both(8, 18, 7, 6, "O"); both(8, 23, 7, 1, "Dk");
  both(7, 9, 7, 10, "O"); both(7, 9, 1, 10, "Dk"); both(3, 12, 5, 8, "O"); both(4, 13, 2, 3, "Lt"); both(3, 19, 5, 1, "Dk");
  both(6, 3, 9, 6, "Lt"); both(6, 3, 9, 1, "O");
  r(12, 10, 1, 2, "Sweat");
  sparkles(r, [[52, 20], [54, 32], [3, 32]]);
});

// 3 — super mode: round aura, bolts, same flex
V["3"] = sprite((r, both) => {
  for (const [s, o] of [[1, 0.16], [0.86, 0.2], [0.7, 0.26]]) for (let y = 0; y < H; y++) {
    const t = (y + 0.5 - 22) / (22 * s); if (Math.abs(t) >= 1) continue;
    const hw = Math.round(27 * s * Math.sqrt(1 - t * t)); if (hw > 0) r(28 - hw, y, hw * 2, 1, "#FFD60A", o);
  }
  body(r, both, false); flexArm(both);
  r(5, 9, 1, 4, "Dk"); r(50, 9, 1, 4, "Dk");
  for (const [x, y] of [[0, 4], [52, 2], [0, 26], [53, 24]]) { r(x + 1, y, 2, 2, "Y"); r(x, y + 2, 2, 2, "Y"); r(x + 1, y + 4, 2, 3, "Y"); }
  for (const [x, y] of [[12, 1], [43, 1], [28, 1]]) { r(x, y, 1, 3, "Y"); r(x - 1, y + 1, 3, 1, "Y"); }
});

const pose = process.argv[2] || "3";
if (!V[pose]) throw new Error("pose must be 1, 2 or 3");
const dir = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(dir, "mascot.svg"), V[pose]);
console.log("wrote mascot.svg (pose " + pose + ")");
