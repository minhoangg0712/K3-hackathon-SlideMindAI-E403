#!/usr/bin/env node
/**
 * Kiểm tra máy đã đủ điều kiện chạy app chưa.
 *
 *   node scripts/doctor.mjs
 *
 * Sinh ra để trả lời đúng một câu hỏi: "máy tôi không render được slide, thiếu
 * gì?". Trình đọc PDF cần ba thứ nằm ngoài git (worker pdfjs, thư mục font,
 * file PDF), thiếu bất kỳ cái nào cũng ra trang trắng mà không báo gì rõ ràng.
 *
 * KHÔNG in giá trị API key, chỉ nói có hay không.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rows = [];
let broken = 0;

function check(label, ok, hint = "") {
  rows.push({ label, ok, hint });
  if (!ok) broken += 1;
}

// --- Node ------------------------------------------------------------------
const major = Number(process.versions.node.split(".")[0]);
check(`Node ${process.versions.node}`, major >= 20, "Cần Node 20 trở lên.");

// --- Dependency ------------------------------------------------------------
const hasModules = existsSync(join(ROOT, "node_modules", "next", "package.json"));
check(
  "node_modules/next",
  hasModules,
  "npm install chưa chạy xong. Xoá node_modules rồi `npm install` lại.",
);

const hasPdfjs = existsSync(join(ROOT, "node_modules", "pdfjs-dist"));
check("node_modules/pdfjs-dist", hasPdfjs, "Chạy `npm install` trước.");

// --- Asset sinh bởi npm run setup ------------------------------------------
const worker = join(ROOT, "public", "pdf.worker.min.mjs");
check(
  "public/pdf.worker.min.mjs",
  existsSync(worker),
  "Chạy `npm run setup`. Thiếu file này thì trình đọc đứng ở 'Đang tải'.",
);

const fonts = join(ROOT, "public", "pdfjs", "standard_fonts");
check(
  "public/pdfjs/standard_fonts",
  existsSync(fonts),
  "Chạy `npm run setup`. Thiếu font thì slide hiện ra trắng trơn.",
);

// --- Slide -----------------------------------------------------------------
const materials = join(ROOT, "public", "materials");
const pdfs = existsSync(materials)
  ? readdirSync(materials).filter((name) => name.endsWith(".pdf"))
  : [];
check(
  `public/materials — ${pdfs.length} file PDF`,
  pdfs.length >= 12,
  "Chạy `npm run setup` để sinh 12 slide mô phỏng. PDF nằm trong .gitignore nên clone về là chưa có.",
);

// File dưới 20KB gần như chắc chắn là file hỏng hoặc tải dở.
const tiny = pdfs.filter((name) => statSync(join(materials, name)).size < 20_000);
check(
  "Không có PDF hỏng",
  tiny.length === 0,
  `File quá nhỏ, nhiều khả năng tải dở: ${tiny.join(", ")}. Xoá đi rồi chạy lại \`npm run setup\`.`,
);

// --- Cấu hình --------------------------------------------------------------
const hasEnv = existsSync(join(ROOT, ".env.local"));
check(
  ".env.local",
  hasEnv,
  "Copy .env.example thành .env.local. Không có thì Tutor chạy chế độ mock (vẫn dùng được, câu trả lời gắn nhãn MOCK).",
);

// --- Font tiếng Việt cho slide mô phỏng ------------------------------------
const { findVietnameseFont } = await import("./lib/ttf.mjs");
const font = findVietnameseFont();
check(
  font ? `Font tiếng Việt: ${font.path.split(/[\\/]/).pop()}` : "Font tiếng Việt",
  Boolean(font),
  "Không tìm thấy font hệ thống có dấu tiếng Việt. Slide mô phỏng vẫn sinh ra nhưng bị bỏ dấu — không ảnh hưởng slide thật.",
);

// --- In kết quả ------------------------------------------------------------
console.log();
for (const row of rows) {
  console.log(`${row.ok ? "  OK  " : " THIEU"}  ${row.label}`);
  if (!row.ok) console.log(`        ${row.hint}`);
}
console.log();

if (broken === 0) {
  console.log("Đủ điều kiện. Chạy `npm run dev` rồi mở http://localhost:3000");
} else {
  console.log(`${broken} mục chưa đạt. Thường chỉ cần:`);
  console.log();
  console.log("  npm install");
  console.log("  npm run setup");
  console.log();
  process.exitCode = 1;
}
