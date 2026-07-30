/**
 * Copy các asset runtime của pdfjs vào public/ (worker, standard fonts, cmaps).
 *
 * Chạy: node scripts/setup-pdfjs.mjs
 *
 * Không có standardFontDataUrl thì pdfjs không vẽ được base-14 font
 * (Helvetica, Times…) và slide hiện ra trắng trơn.
 */
import { cp, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "node_modules", "pdfjs-dist");
const PUBLIC = join(ROOT, "public");

try {
  await access(SRC);
} catch {
  console.error("Khong tim thay node_modules/pdfjs-dist. Chay `npm install` truoc.");
  process.exit(1);
}

await mkdir(join(PUBLIC, "pdfjs"), { recursive: true });

await cp(join(SRC, "build", "pdf.worker.min.mjs"), join(PUBLIC, "pdf.worker.min.mjs"));
await cp(join(SRC, "standard_fonts"), join(PUBLIC, "pdfjs", "standard_fonts"), { recursive: true });
await cp(join(SRC, "cmaps"), join(PUBLIC, "pdfjs", "cmaps"), { recursive: true });

console.log("Da copy pdf.worker.min.mjs, standard_fonts va cmaps vao public/.");
