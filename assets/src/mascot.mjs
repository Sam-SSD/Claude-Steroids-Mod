// Draws the Steroids mascot as a pixel-art SVG (original drawing, an homage to the orange Claude Code critter).
// Usage: node assets/src/mascot.mjs   ->  writes assets/src/mascot.svg
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const C = {
  O: "#D97757", Dk: "#A9482D", Lt: "#F3A584", K: "#1B1210", W: "#FFFFFF", Sh: "#0B0B0F", Shine: "#7DD3FC",
  Gr: "#C3CAD2", Gd: "#6B7280", Rd: "#E5484D", Rdd: "#A31D23", Y: "#FFD60A", Tank: "#1F2937", Tank2: "#111827", Pants: "#374151", Sweat: "#60A5FA",
};
const W = 48, H = 40;
const out = [];
const r = (x, y, w, h, c) => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C[c] || c}"/>`);
const mirror = (x, w) => W - x - w;
const both = (x, y, w, h, c) => { r(x, y, w, h, c); r(mirror(x, w), y, w, h, c); };

// --- barbell (overhead press) ---
both(0, 0, 4, 10, "Rd"); both(0, 0, 1, 10, "Rdd"); both(3, 0, 1, 10, "Rdd");
both(4, 2, 2, 6, "Gr"); both(4, 2, 1, 6, "Gd");
r(6, 4, 36, 2, "Gr"); r(6, 5, 36, 1, "Gd");
// --- forearms + fists ---
both(14, 3, 6, 5, "Lt"); both(14, 3, 6, 1, "O");
both(15, 8, 4, 6, "O"); both(15, 8, 1, 6, "Dk");
// --- biceps (big) ---
both(9, 13, 10, 9, "O"); both(10, 14, 3, 4, "Lt"); both(9, 21, 10, 1, "Dk"); both(9, 13, 1, 9, "Dk");
// veins
r(15, 15, 1, 3, "Dk"); r(32, 15, 1, 3, "Dk");
// --- head ---
r(19, 9, 10, 10, "O"); r(19, 9, 10, 1, "Lt"); r(28, 10, 1, 9, "Dk");
// sunglasses
r(20, 12, 8, 3, "Sh"); r(23, 12, 2, 3, "O"); r(21, 12, 2, 1, "Shine"); r(26, 12, 1, 1, "Shine");
// gritted teeth
r(21, 16, 6, 3, "K"); r(22, 16, 4, 2, "W"); r(24, 16, 1, 2, "K");
// sweat
r(17, 10, 1, 2, "Sweat"); r(30, 8, 1, 2, "Sweat");
// --- torso (shoulders + tank top) ---
r(12, 19, 24, 4, "O"); r(12, 19, 24, 1, "Lt");
r(14, 23, 20, 2, "O");
r(16, 19, 16, 12, "Tank"); r(16, 19, 3, 2, "O"); r(29, 19, 3, 2, "O"); r(20, 19, 8, 1, "O");
r(16, 21, 16, 10, "Tank"); r(30, 21, 2, 10, "Tank2");
// lightning bolt on the chest
r(25, 22, 3, 1, "Y"); r(24, 23, 3, 1, "Y"); r(23, 24, 4, 1, "Y"); r(25, 25, 2, 1, "Y"); r(24, 26, 2, 1, "Y"); r(23, 27, 2, 1, "Y"); r(23, 28, 1, 1, "Y");
// pecs shadow
r(20, 21, 1, 3, "Tank2");
// --- shorts and legs ---
r(17, 31, 14, 4, "Pants"); r(24, 31, 1, 4, "Tank2");
r(18, 35, 5, 3, "O"); r(25, 35, 5, 3, "O"); r(18, 35, 1, 3, "Dk"); r(25, 35, 1, 3, "Dk");
r(16, 38, 8, 2, "Dk"); r(24, 38, 8, 2, "Dk");
// --- pump sparkles ---
for (const [x, y] of [[42, 15], [44, 25], [41, 33]]) { r(x, y - 1, 1, 3, "Y"); r(x - 1, y, 3, 1, "Y"); }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 10}" height="${H * 10}" shape-rendering="crispEdges">\n${out.join("\n")}\n</svg>\n`;
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "mascot.svg");
fs.writeFileSync(file, svg);
console.log("wrote", file, `(${out.length} rects)`);
