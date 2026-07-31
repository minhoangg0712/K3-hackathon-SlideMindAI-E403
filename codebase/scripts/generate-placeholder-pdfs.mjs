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
import { encodeText, findVietnameseFont, toUnicodeCMap, widthArray } from "./lib/ttf.mjs";

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
 * Nội dung slide của day01_302.pdf.
 *
 * Trang 1-3 lấy nguyên văn từ text layer bản gốc. Trang 4-14 là nội dung MÔ
 * PHỎNG do nhóm viết, bám đúng agenda ở trang 3 — cần chúng vì corpus chỉ có
 * ba trang thật thì không đủ để thử retrieval: mọi câu hỏi đều rơi vào "slide
 * không đề cập", và bộ test không phân biệt được sản phẩm tốt với sản phẩm im
 * lặng. Trang mô phỏng có nhãn riêng ở chân trang, xem MOCK_PAGES_FROM.
 */
const KNOWN_CONTENT = {
  material_ms2039d0_hnxpxy: {
    1: ["AI IN ACTION", "Day 1", "AI & LLM Foundation", "Ban dang dung AI moi ngay -", "nhung thuc su ben trong no dang lam gi?", "Instructor: Mai Anh Nguyen"],
    2: ["Mai Anh Nguyen", "Generalist Product Builder", "2026 FPT Long Chau (PM - Healthcare Product)", "2025 Thongtincuuho.org (Co-founder)", "2025 FPT Software AI Center (PM - AI Agent)", "2021-2025 Xantus (PM - On-chain Analytics, AI Agent)", "2016-2021 DYNO, Kalapa (PM - OCR, eKYC, Credit Scoring)"],
    3: ["Day 1 - Agenda", "- Buc tranh AI & cac tang cua AI", "- Lich su AI 70 nam", "- Ben trong LLM: co che van hanh", "- Tu LLM den AI Agent", "- Landscape: model hom nay & cuoc dua hien tai", "- Chon model & chi phi token", "- Goi API lan dau", "- Tong ket - nhung y de mang ve"],
    4: ["Các tầng của AI", "AI là tập lớn nhất: mọi hệ thống bắt chước hành vi thông minh", "Machine Learning: học quy luật từ dữ liệu thay vì viết luật bằng tay", "Deep Learning: mạng nơ-ron nhiều lớp, tự rút ra đặc trưng", "Generative AI: sinh ra nội dung mới thay vì chỉ phân loại", "LLM là một nhánh của Generative AI, chuyên về ngôn ngữ"],
    5: ["Lịch sử AI 70 năm", "1956 Hội thảo Dartmouth - khai sinh thuật ngữ Artificial Intelligence", "1974-1980 Mùa đông AI lần một: kỳ vọng vượt xa năng lực tính toán", "1997 Deep Blue thắng Kasparov - AI thắng người ở cờ vua", "2012 AlexNet - deep learning bùng nổ nhờ GPU", "2017 Kiến trúc Transformer ra đời", "2022 ChatGPT đưa LLM đến với người dùng phổ thông"],
    6: ["Bên trong LLM: token", "Model không đọc chữ, nó đọc token", "Token là mảnh văn bản: một từ ngắn thường là một token", "Tiếng Việt có dấu tốn nhiều token hơn tiếng Anh cùng ý nghĩa", "Trung bình 1 token xấp xỉ 4 ký tự tiếng Anh", "Mọi chi phí gọi API đều tính theo số token vào và ra"],
    7: ["Bên trong LLM: dự đoán token tiếp theo", "LLM không tra cứu cơ sở dữ liệu, nó dự đoán token kế tiếp", "Mỗi bước sinh ra một phân phối xác suất trên toàn bộ từ vựng", "Temperature điều chỉnh độ ngẫu nhiên khi chọn token", "Temperature 0 cho kết quả ổn định, thích hợp khi cần lặp lại được", "Đây là lý do model có thể nói sai mà vẫn rất tự tin"],
    8: ["Kiến trúc Transformer", "Attention cho phép model nhìn toàn bộ câu cùng lúc", "Self-attention: mỗi token đánh trọng số cho mọi token khác", "Multi-head attention: nhiều góc nhìn song song trên cùng chuỗi", "Positional encoding bù lại việc attention không có thứ tự", "Bài báo gốc: Attention Is All You Need, 2017"],
    9: ["Context window", "Context window là số token tối đa model đọc được trong một lượt", "Vượt quá giới hạn thì phần đầu bị cắt, model quên mất đầu bài", "Cắt âm thầm là lỗi thiết kế: người dùng không biết mình mất chữ", "Cửa sổ lớn không miễn phí: chi phí và độ trễ tăng theo độ dài", "Nên chọn lọc ngữ cảnh thay vì nhồi tất cả vào prompt"],
    10: ["Hallucination - vì sao model bịa", "Model tối ưu cho tính hợp lý của câu, không phải tính đúng của sự thật", "Khi thiếu dữ liệu, nó vẫn sinh ra câu nghe rất trơn tru", "Càng hỏi về chi tiết hẹp, nguy cơ bịa càng cao", "Cách giảm: cung cấp nguồn thật và bắt model trích dẫn nguồn", "Cách đo: kiểm tra từng trích dẫn có thật nằm trong tài liệu không"],
    11: ["Từ LLM đến AI Agent", "LLM thuần tuý: một câu hỏi, một câu trả lời, không hành động", "Agent: có mục tiêu, có công cụ, có vòng lặp quan sát và điều chỉnh", "Ba thành phần: bộ não là LLM, công cụ là API, bộ nhớ là trạng thái", "Agent tự quyết định gọi công cụ nào và gọi mấy lần", "Đánh đổi: mạnh hơn nhưng chậm hơn và khó dự đoán hơn"],
    12: ["Landscape model hôm nay", "Ba nhóm chính: closed-source API, open-weight, và model chạy trên máy", "Closed-source mạnh nhất nhưng phụ thuộc nhà cung cấp và giá", "Open-weight cho phép tự host, kiểm soát dữ liệu, chi phí cố định", "Model nhỏ chạy được trên laptop, đủ cho tác vụ đơn giản", "Chọn theo bài toán chứ không chọn theo bảng xếp hạng"],
    13: ["Chọn model và chi phí token", "Giá tính riêng cho token vào và token ra, token ra thường đắt hơn", "Model mạnh nhất không phải lựa chọn đúng cho mọi bước", "Chiến lược cascade: model rẻ trước, chỉ leo lên bậc cao khi cần", "Cache lại câu trả lời cho câu hỏi lặp lại để khỏi trả tiền hai lần", "Free tier siết theo phút và theo ngày, phải thiết kế để không vỡ"],
    14: ["Tổng kết Day 1", "LLM dự đoán token, không tra cứu sự thật", "Context window hữu hạn - phải chọn lọc ngữ cảnh", "Hallucination là đặc tính, không phải lỗi ngẫu nhiên", "Agent = LLM + công cụ + vòng lặp", "Chi phí và quota là ràng buộc thiết kế, không phải chi tiết kỹ thuật"],
  },
};

/**
 * Từ trang này trở đi trong mỗi tài liệu là nội dung mô phỏng, không phải chữ
 * lấy từ slide gốc. Chân trang ghi rõ để không ai nhầm khi demo.
 */
const MOCK_PAGES_FROM = {
  material_ms2039d0_hnxpxy: 4,
};

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;

/**
 * Font nhúng có đủ glyph tiếng Việt, tìm trong font hệ thống. Không có thì
 * quay về Helvetica và bỏ dấu — slide vẫn đọc được, chỉ mất dấu.
 */
const FONT = findVietnameseFont();

/** Glyph thực sự dùng, để mảng W của CIDFont không phải liệt kê cả 5000 glyph. */
const usedGlyphs = new Set();

/**
 * Một đoạn text trong content stream.
 *
 * Có font nhúng thì viết hex glyph id (Identity-H) và giữ nguyên dấu; không thì
 * viết chuỗi WinAnsi đã bỏ dấu như trước.
 */
function drawText(text, { size, color, x, y }) {
  if (FONT) {
    for (const ch of text) {
      const glyph = FONT.cmap.get(ch.codePointAt(0));
      if (glyph !== undefined) usedGlyphs.add(glyph);
    }
    return `BT /F1 ${size} Tf ${color} rg ${x} ${y} Td <${encodeText(FONT, text)}> Tj ET`;
  }
  return `BT /F1 ${size} Tf ${color} rg ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

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

  lines.push(
    drawText(`${material.day} - ${material.name}`, {
      size: 11,
      color: "0.45 0.5 0.55",
      x: 48,
      y: PAGE_HEIGHT - 46,
    }),
  );

  if (known) {
    let y = PAGE_HEIGHT - 120;
    known.forEach((line, index) => {
      const size = index === 0 ? 26 : index < 3 ? 20 : 14;
      const color = index < 3 ? "0.07 0.31 0.55" : "0.15 0.18 0.22";
      lines.push(drawText(line, { size, color, x: 48, y }));
      y -= size + 16;
    });
  } else {
    lines.push(
      drawText(`${material.day} - Slide ${pageNumber}`, {
        size: 30,
        color: "0.07 0.31 0.55",
        x: 48,
        y: PAGE_HEIGHT - 140,
      }),
    );
    lines.push(
      drawText(`Slide mô phỏng. Thay bằng slide thật tại public/materials/${material.id}.pdf`, {
        size: 14,
        color: "0.45 0.5 0.55",
        x: 48,
        y: PAGE_HEIGHT - 190,
      }),
    );
  }

  lines.push(
    drawText(`Trang ${pageNumber} / ${material.pages}`, {
      size: 10,
      color: "0.6 0.64 0.69",
      x: PAGE_WIDTH - 120,
      y: 32,
    }),
  );

  // Nhãn phân biệt trang nội dung mô phỏng với trang chép từ slide gốc.
  const mockFrom = MOCK_PAGES_FROM[material.id];
  if (known && mockFrom && pageNumber >= mockFrom) {
    lines.push(
      drawText("Nội dung mô phỏng do nhóm soạn, không phải chữ trên slide gốc.", {
        size: 9,
        color: "0.72 0.45 0.1",
        x: 48,
        y: 32,
      }),
    );
  }

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

  // Dựng nội dung trang TRƯỚC khi mô tả font: mảng W của CIDFont chỉ liệt kê
  // glyph thật sự dùng, mà tập đó chỉ biết sau khi đã vẽ xong mọi trang.
  const streams = [];
  for (let pageNumber = 1; pageNumber <= material.pages; pageNumber += 1) {
    streams.push(contentStream(material, pageNumber));
  }

  // Font nhúng: chỉ tạo các object này khi máy có font đủ glyph tiếng Việt.
  let textFontId = fontId;
  if (FONT) {
    const fileId = push(
      `<< /Length ${FONT.data.length} /Length1 ${FONT.data.length} >>\nstream\n` +
        `${FONT.data.toString("latin1")}\nendstream`,
    );
    const descriptorId = push(
      `<< /Type /FontDescriptor /FontName /EmbeddedVN /Flags 32 ` +
        `/FontBBox [-1000 -400 2000 1100] /ItalicAngle 0 /Ascent 900 /Descent -200 ` +
        `/CapHeight 700 /StemV 80 /FontFile2 ${fileId} 0 R >>`,
    );
    const cidFontId = push(
      `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /EmbeddedVN ` +
        `/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> ` +
        `/FontDescriptor ${descriptorId} 0 R /DW 1000 /W [${widthArray(FONT, usedGlyphs)}] ` +
        `/CIDToGIDMap /Identity >>`,
    );
    // Không có ToUnicode thì PDF vẫn hiện đúng chữ nhưng lớp text bên dưới
    // chỉ là số hiệu glyph — Tutor đọc slide bằng lớp đó nên bắt buộc phải có.
    const cmap = toUnicodeCMap(FONT, usedGlyphs);
    const toUnicodeId = push(
      `<< /Length ${Buffer.byteLength(cmap, "latin1")} >>\nstream\n${cmap}\nendstream`,
    );
    textFontId = push(
      `<< /Type /Font /Subtype /Type0 /BaseFont /EmbeddedVN ` +
        `/Encoding /Identity-H /DescendantFonts [${cidFontId} 0 R] ` +
        `/ToUnicode ${toUnicodeId} 0 R >>`,
    );
  }

  const pageIds = [];
  for (const stream of streams) {
    const streamId = push(
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    );
    pageIds.push(
      push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
          `/Resources << /Font << /F1 ${textFontId} 0 R >> >> /Contents ${streamId} 0 R >>`,
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
