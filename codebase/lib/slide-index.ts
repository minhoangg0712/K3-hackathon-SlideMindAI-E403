import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DOCUMENTS } from "@/data/fixtures";

/**
 * Trích text từng trang của học liệu PDF để Tutor có căn cứ thật khi trả lời.
 *
 * Bản gốc chỉ gửi số trang lên backend, nên tutor thường trả lời "trong tài
 * liệu không đề cập". Ở đây ta đọc nội dung slide ngay tại server và truyền
 * đúng đoạn liên quan vào prompt, để mọi citation là substring của slide.
 */

export interface SlidePage {
  page: number;
  text: string;
}

export interface SlideDocument {
  materialId: string;
  fileName: string;
  pages: SlidePage[];
}

const cache = new Map<string, Promise<SlideDocument | null>>();

async function extract(materialId: string): Promise<SlideDocument | null> {
  const doc = DOCUMENTS.find((item) => item.material_id === materialId);
  if (!doc) return null;

  const filePath = path.join(process.cwd(), "public", "materials", `${materialId}.pdf`);

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return null;
  }

  // Legacy build là bản chạy được trong Node (không cần DOM).
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // pdfjs đòi URL kết thúc bằng "/" — dấu \ của Windows bị nó từ chối.
  const fontDir = `${pathToFileURL(path.join(process.cwd(), "public", "pdfjs", "standard_fonts")).href}/`;
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(data),
    // Không cần worker khi chỉ lấy text layer, nhưng vẫn cần font data
    // để pdfjs không cảnh báo và bỏ qua base-14 font.
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: fontDir,
  }).promise;

  const pages: SlidePage[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: pageNumber, text });
    page.cleanup();
  }
  await pdf.destroy();

  return { materialId, fileName: doc.file_name, pages };
}

export function loadSlideDocument(materialId: string): Promise<SlideDocument | null> {
  let pending = cache.get(materialId);
  if (!pending) {
    pending = extract(materialId).catch((cause) => {
      // Không để Tutor chết vì một tài liệu lỗi, nhưng phải thấy được lý do.
      console.error(`[slide-index] không đọc được ${materialId}:`, cause);
      return null;
    });
    cache.set(materialId, pending);
  }
  return pending;
}

/** Bỏ dấu để so khớp không phụ thuộc cách người học gõ tiếng Việt. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

const STOP_WORDS = new Set([
  "la","va","cua","cho","mot","nhung","duoc","trong","voi","tai","den","khi","nay","thi",
  "co","khong","nhu","de","ra","tu","ve","gi","sao","the","nao","minh","ban","em","toi",
  "the","hay","hoac","cac","cai","bi","se","da","dang","phai","can","hon","rat","chi",
  "the","that","that","lam","noi","hoi","giai","thich","the","nghia","tren","duoi",
  "the","a","an","the","is","are","of","to","in","for","and","or","what","why","how",
]);

export interface SlideHit {
  page: number;
  quote: string;
  score: number;
}

/**
 * Tìm những trang slide liên quan nhất tới câu hỏi. Chấm điểm theo số token
 * trùng, ưu tiên trang người học đang mở.
 */
export function searchSlides(
  doc: SlideDocument,
  query: string,
  currentPage: number | undefined,
  limit = 4,
): SlideHit[] {
  const tokens = Array.from(
    new Set(
      normalize(query)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
    ),
  );

  const hits: SlideHit[] = [];
  for (const page of doc.pages) {
    if (!page.text) continue;
    const haystack = normalize(page.text);

    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
    }
    if (score === 0) continue;

    // Trang đang đọc được cộng điểm để câu trả lời sát ngữ cảnh.
    if (currentPage && Math.abs(page.page - currentPage) <= 1) score += 1.5;

    hits.push({ page: page.page, quote: excerpt(page.text, tokens), score });
  }

  hits.sort((a, b) => b.score - a.score || a.page - b.page);
  return hits.slice(0, limit);
}

/** Lấy đoạn quanh từ khóa khớp đầu tiên, để quote luôn là substring của slide. */
function excerpt(text: string, tokens: string[], width = 280): string {
  const haystack = normalize(text);
  let at = -1;
  for (const token of tokens) {
    const index = haystack.indexOf(token);
    if (index !== -1 && (at === -1 || index < at)) at = index;
  }
  if (at === -1) return text.slice(0, width);

  const start = Math.max(0, at - Math.floor(width / 3));
  return (start > 0 ? "…" : "") + text.slice(start, start + width).trim();
}
