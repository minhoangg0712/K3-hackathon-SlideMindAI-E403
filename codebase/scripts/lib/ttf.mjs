/**
 * Đọc đủ thông tin của một file TrueType để nhúng vào PDF và viết được tiếng
 * Việt có dấu.
 *
 * Vì sao cần: 14 font chuẩn của PDF (Helvetica, Times…) mã hoá WinAnsi, không
 * có ă ơ ư và toàn bộ khối Latin Extended Additional (ạ ế ộ ữ…). Muốn slide
 * mô phỏng hiện đúng chữ tiếng Việt thì phải nhúng một font thật.
 *
 * Chỉ đọc ba bảng: cmap (unicode -> glyph id), head (unitsPerEm), hmtx/hhea
 * (advance width). Không subset — nhúng nguyên file cho đơn giản, PDF sinh ra
 * nằm trong .gitignore nên vài trăm KB không ảnh hưởng gì.
 */
import { readFileSync, existsSync } from "node:fs";
import { platform } from "node:os";

/** Font hệ thống có đủ glyph tiếng Việt, xếp theo thứ tự ưu tiên. */
const CANDIDATES = {
  win32: [
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
  ],
  darwin: [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
  ],
  linux: [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
  ],
};

/** Vài ký tự đại diện: thiếu một trong số này là font không dùng được. */
const REQUIRED = [0x103, 0x1a1, 0x1b0, 0x111, 0x1ea1, 0x1ebf, 0x1ed9, 0x1eef];

function tableOffsets(buf) {
  const tables = new Map();
  const count = buf.readUInt16BE(4);
  for (let i = 0; i < count; i += 1) {
    const at = 12 + i * 16;
    tables.set(buf.toString("latin1", at, at + 4), {
      offset: buf.readUInt32BE(at + 8),
      length: buf.readUInt32BE(at + 12),
    });
  }
  return tables;
}

/** Bảng cmap format 4 (BMP) — đủ cho tiếng Việt, không cần format 12. */
function readCmap(buf, offset) {
  const subtableCount = buf.readUInt16BE(offset + 2);
  let best = 0;
  for (let i = 0; i < subtableCount; i += 1) {
    const rec = offset + 4 + i * 8;
    const platformId = buf.readUInt16BE(rec);
    const encodingId = buf.readUInt16BE(rec + 2);
    if (platformId === 3 && (encodingId === 1 || encodingId === 10)) {
      best = offset + buf.readUInt32BE(rec + 4);
    }
  }
  if (!best || buf.readUInt16BE(best) !== 4) return null;

  const segCountX2 = buf.readUInt16BE(best + 6);
  const segCount = segCountX2 / 2;
  const endAt = best + 14;
  const startAt = endAt + segCountX2 + 2;
  const deltaAt = startAt + segCountX2;
  const rangeAt = deltaAt + segCountX2;

  const map = new Map();
  for (let seg = 0; seg < segCount; seg += 1) {
    const end = buf.readUInt16BE(endAt + seg * 2);
    const start = buf.readUInt16BE(startAt + seg * 2);
    if (start === 0xffff) continue;
    const delta = buf.readInt16BE(deltaAt + seg * 2);
    const rangeOffset = buf.readUInt16BE(rangeAt + seg * 2);

    for (let code = start; code <= end; code += 1) {
      let glyph;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        const at = rangeAt + seg * 2 + rangeOffset + (code - start) * 2;
        if (at + 1 >= buf.length) continue;
        glyph = buf.readUInt16BE(at);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) map.set(code, glyph);
    }
  }
  return map;
}

function readWidths(buf, tables, numGlyphs) {
  const hhea = tables.get("hhea");
  const hmtx = tables.get("hmtx");
  if (!hhea || !hmtx) return [];

  const numHMetrics = buf.readUInt16BE(hhea.offset + 34);
  const widths = new Array(numGlyphs).fill(0);
  let last = 0;
  for (let glyph = 0; glyph < numGlyphs; glyph += 1) {
    if (glyph < numHMetrics) {
      last = buf.readUInt16BE(hmtx.offset + glyph * 4);
    }
    widths[glyph] = last;
  }
  return widths;
}

export function loadFont(filePath) {
  const buf = readFileSync(filePath);
  const tables = tableOffsets(buf);

  const head = tables.get("head");
  const maxp = tables.get("maxp");
  const cmapTable = tables.get("cmap");
  if (!head || !maxp || !cmapTable) return null;

  const unitsPerEm = buf.readUInt16BE(head.offset + 18);
  const numGlyphs = buf.readUInt16BE(maxp.offset + 4);
  const cmap = readCmap(buf, cmapTable.offset);
  if (!cmap) return null;

  if (REQUIRED.some((code) => !cmap.has(code))) return null;

  return {
    path: filePath,
    data: buf,
    unitsPerEm,
    numGlyphs,
    cmap,
    widths: readWidths(buf, tables, numGlyphs),
  };
}

/** Font đầu tiên trên máy này có đủ glyph tiếng Việt, hoặc null. */
export function findVietnameseFont() {
  for (const candidate of CANDIDATES[platform()] ?? []) {
    if (!existsSync(candidate)) continue;
    try {
      const font = loadFont(candidate);
      if (font) return font;
    } catch {
      /* file hỏng hoặc không phải TTF thuần — thử cái tiếp theo */
    }
  }
  return null;
}

/**
 * Mã hoá chuỗi thành hex glyph id, đúng dạng Identity-H cần: mỗi glyph 2 byte.
 * Ký tự không có trong font bị bỏ qua chứ không vẽ ô vuông.
 */
export function encodeText(font, text) {
  let out = "";
  for (const ch of text) {
    const glyph = font.cmap.get(ch.codePointAt(0));
    if (glyph === undefined) continue;
    out += glyph.toString(16).padStart(4, "0");
  }
  return out;
}

/** Bề rộng chuỗi tính bằng đơn vị point ở cỡ chữ đã cho. */
export function measure(font, text, size) {
  let total = 0;
  for (const ch of text) {
    const glyph = font.cmap.get(ch.codePointAt(0));
    if (glyph === undefined) continue;
    total += font.widths[glyph] ?? font.unitsPerEm / 2;
  }
  return (total / font.unitsPerEm) * size;
}

/**
 * CMap ánh xạ glyph id ngược về Unicode.
 *
 * Bắt buộc phải có: không thì PDF vẫn VẼ đúng chữ nhưng lớp text bên dưới chỉ
 * là số hiệu glyph. Copy ra được toàn ký tự rác, và quan trọng hơn — Tutor đọc
 * text layer để tìm nội dung slide, thiếu bảng này là nó đọc rác.
 */
export function toUnicodeCMap(font, usedGlyphs) {
  // Đảo cmap: một glyph có thể ứng nhiều code point, lấy cái đầu là đủ.
  const reverse = new Map();
  for (const [code, glyph] of font.cmap) {
    if (!reverse.has(glyph)) reverse.set(glyph, code);
  }

  const entries = Array.from(usedGlyphs)
    .sort((a, b) => a - b)
    .filter((glyph) => reverse.has(glyph))
    .map((glyph) => {
      const code = reverse.get(glyph);
      // Trên BMP nên luôn 4 hex; ngoài BMP thì cần surrogate pair.
      const unicode =
        code > 0xffff
          ? [
              (((code - 0x10000) >> 10) + 0xd800).toString(16).padStart(4, "0"),
              (((code - 0x10000) & 0x3ff) + 0xdc00).toString(16).padStart(4, "0"),
            ].join("")
          : code.toString(16).padStart(4, "0");
      return `<${glyph.toString(16).padStart(4, "0")}> <${unicode}>`;
    });

  // Mỗi khối bfchar tối đa 100 dòng theo đặc tả.
  const blocks = [];
  for (let at = 0; at < entries.length; at += 100) {
    const chunk = entries.slice(at, at + 100);
    blocks.push(`${chunk.length} beginbfchar\n${chunk.join("\n")}\nendbfchar`);
  }

  return [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /Adobe-Identity-UCS def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    "<0000> <FFFF>",
    "endcodespacerange",
    ...blocks,
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");
}

/** Mảng W của CIDFont: chỉ liệt kê glyph thật sự dùng, cho PDF gọn. */
export function widthArray(font, usedGlyphs) {
  const sorted = Array.from(usedGlyphs).sort((a, b) => a - b);
  const parts = [];
  for (const glyph of sorted) {
    const width = Math.round(((font.widths[glyph] ?? 0) / font.unitsPerEm) * 1000);
    parts.push(`${glyph} [${width}]`);
  }
  return parts.join(" ");
}
