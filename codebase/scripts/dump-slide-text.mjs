#!/usr/bin/env node
/** In text từng trang của một học liệu, để soạn bộ câu thử bám nội dung thật. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const materialId = process.argv[2];
const from = Number(process.argv[3] ?? 1);
const to = Number(process.argv[4] ?? 999);
if (!materialId) {
  console.error("dùng: node scripts/dump-slide-text.mjs <material_id> [từ] [đến]");
  process.exit(1);
}

const data = await readFile(path.join(process.cwd(), "public", "materials", `${materialId}.pdf`));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const fontDir = `${pathToFileURL(path.join(process.cwd(), "public", "pdfjs", "standard_fonts")).href}/`;
const pdf = await pdfjs.getDocument({
  data: new Uint8Array(data),
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: false,
  standardFontDataUrl: fontDir,
}).promise;

for (let n = Math.max(1, from); n <= Math.min(pdf.numPages, to); n += 1) {
  const content = await (await pdf.getPage(n)).getTextContent();
  const text = content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  console.log(`\n=== trang ${n}/${pdf.numPages} ===\n${text.slice(0, 700)}`);
}
