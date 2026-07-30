/**
 * Sinh PDF placeholder cho từng học liệu trong fixtures, để trình đọc chạy
 * được khi chưa có slide thật.
 *
 * Chạy: node scripts/generate-placeholder-pdfs.mjs
 *
 * Script KHÔNG ghi đè file đã có — thả slide thật vào
 * public/materials/<material_id>.pdf là nó tự được dùng thay placeholder.
 */
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "materials");

/** Giữ đồng bộ với MATERIAL_SEED trong data/fixtures.ts. */
const MATERIALS = [
  { id: "material_ms2039d0_hnxpxy", name: "day01_302.pdf", pages: 83, day: "Day 1" },
  { id: "material_ms203mb1_squf06", name: "material_mrxpq9zu_t8e6xs.pdf", pages: 32, day: "Day 1" },
  { id: "material_ms203vsq_ob7vqp", name: "material_95eb786b4d9e.pdf", pages: 76, day: "Day 2" },
  { id: "material_ms2044ey_k6uor3", name: "day03-tu-chatbot-den-agentic-agent-react.pdf", pages: 46, day: "Day 3" },
  { id: "material_ms2lb2ke_c1je8j", name: "Day03-D302-tu-chatbot-den-agentic-agent-react.pdf", pages: 60, day: "Day 3" },
  { id: "material_ms204i6x_gqwyya", name: "day04-prompt-engineering-tool-calling.pdf", pages: 43, day: "Day 4" },
  { id: "material_ms4ahenz_7cpqa2", name: "day04-prompt-engineering-tool-calling.pdf", pages: 78, day: "Day 4" },
  { id: "material_ms4x7dx1_t0qyxg", name: "day04-prompt-engineering-tool-calling.pdf", pages: 98, day: "Day 4" },
  { id: "material_ms204v3b_r9mo78", name: "day05-ai-product-thinking-requirements.pdf", pages: 44, day: "Day 5" },
  { id: "material_ms5r18w1_oe5xlz", name: "day05-lecture-slides-batch03.pdf", pages: 39, day: "Day 5" },
  { id: "material_ms5rpr5o_wgl8wy", name: "day05-slide-batch03-C401.pdf", pages: 62, day: "Day 5" },
  { id: "material_ms204yc9_gxpg9y", name: "day06-ai-product-project-management.pdf", pages: 37, day: "Day 6" },
];

/**
 * Nội dung 3 slide đầu của day01_302.pdf, lấy từ text layer của bản gốc.
 * Có nội dung thật giúp phần RAG của Tutor demo thuyết phục hơn placeholder.
 */
const KNOWN_CONTENT = {
  material_ms2039d0_hnxpxy: {
    1: ["AI IN ACTION", "Day 1", "AI & LLM Foundation", "Ban dang dung AI moi ngay -", "nhung thuc su ben trong no dang lam gi?", "Instructor: Mai Anh Nguyen"],
    2: ["Mai Anh Nguyen", "Generalist Product Builder", "2026 FPT Long Chau (PM - Healthcare Product)", "2025 Thongtincuuho.org (Co-founder)", "2025 FPT Software AI Center (PM - AI Agent)", "2021-2025 Xantus (PM - On-chain Analytics, AI Agent)", "2016-2021 DYNO, Kalapa (PM - OCR, eKYC, Credit Scoring)"],
    3: ["Day 1 - Agenda", "- Buc tranh AI & cac tang cua AI", "- Lich su AI 70 nam", "- Ben trong LLM: co che van hanh", "- Tu LLM den AI Agent", "- Landscape: model hom nay & cuoc dua hien tai", "- Chon model & chi phi token", "- Goi API lan dau", "- Tong ket - nhung y de mang ve"],
  },
};

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;

/** PDF base font Helvetica chỉ có WinAnsi, nên bỏ dấu tiếng Việt. */
function toAscii(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .replace(/[^\x20-\x7e]/g, "");
}

function escapePdfText(text) {
  return toAscii(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function contentStream(material, pageNumber) {
  const known = KNOWN_CONTENT[material.id]?.[pageNumber];
  const lines = [];

  // Dải màu navy trên đầu + khối đỏ góc phải, cho giống nhận diện VLearn.
  lines.push("q 0.07 0.31 0.55 rg 0 " + (PAGE_HEIGHT - 14) + " " + PAGE_WIDTH + " 14 re f Q");
  lines.push("q 0.78 0.13 0.15 rg " + (PAGE_WIDTH - 120) + " " + (PAGE_HEIGHT - 14) + " 120 14 re f Q");

  lines.push("BT /F1 11 Tf 0.45 0.5 0.55 rg 48 " + (PAGE_HEIGHT - 46) + " Td");
  lines.push("(" + escapePdfText(`${material.day} - ${material.name}`) + ") Tj ET");

  if (known) {
    let y = PAGE_HEIGHT - 120;
    known.forEach((line, index) => {
      const size = index === 0 ? 26 : index < 3 ? 20 : 14;
      const color = index < 3 ? "0.07 0.31 0.55" : "0.15 0.18 0.22";
      lines.push(`BT /F1 ${size} Tf ${color} rg 48 ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= size + 16;
    });
  } else {
    lines.push(
      "BT /F1 30 Tf 0.07 0.31 0.55 rg 48 " +
        (PAGE_HEIGHT - 140) +
        " Td (" +
        escapePdfText(`${material.day} - Slide ${pageNumber}`) +
        ") Tj ET",
    );
    lines.push(
      "BT /F1 14 Tf 0.45 0.5 0.55 rg 48 " +
        (PAGE_HEIGHT - 190) +
        " Td (Placeholder slide. Thay bang slide that tai public/materials/" +
        escapePdfText(material.id) +
        ".pdf) Tj ET",
    );
  }

  lines.push(
    "BT /F1 10 Tf 0.6 0.64 0.69 rg " +
      (PAGE_WIDTH - 120) +
      " 32 Td (" +
      escapePdfText(`Trang ${pageNumber} / ${material.pages}`) +
      ") Tj ET",
  );

  return lines.join("\n");
}

function buildPdf(material) {
  const objects = [];
  /** Thêm một object, trả về số hiệu của nó (1-indexed). */
  const push = (body) => {
    objects.push(body);
    return objects.length;
  };

  // Giữ chỗ cho Catalog (1) và Pages (2) để tham chiếu được trước khi biết kids.
  push(null);
  push(null);
  const fontId = push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

  const pageIds = [];
  for (let pageNumber = 1; pageNumber <= material.pages; pageNumber += 1) {
    const stream = contentStream(material, pageNumber);
    const streamId = push(
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    );
    pageIds.push(
      push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
          `/Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`,
      ),
    );
  }

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] =
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

mkdirSync(OUT_DIR, { recursive: true });

let created = 0;
let skipped = 0;
for (const material of MATERIALS) {
  const target = join(OUT_DIR, `${material.id}.pdf`);
  if (existsSync(target)) {
    skipped += 1;
    continue;
  }
  writeFileSync(target, buildPdf(material));
  created += 1;
}

console.log(`Placeholder PDF: tao moi ${created}, giu nguyen ${skipped} (da ton tai).`);
console.log(`Thu muc: ${OUT_DIR}`);
