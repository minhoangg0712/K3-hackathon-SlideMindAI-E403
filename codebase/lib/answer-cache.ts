import { createHash } from "node:crypto";
import type { Citation } from "@/lib/types";

/**
 * Cache câu trả lời theo chữ ký câu hỏi.
 *
 * Bản gốc trả `cache_hit:!1` — hằng số false. Hỏi lại đúng câu vừa hỏi vẫn
 * tốn một lượt gọi model và một lượt quota, trong khi sinh viên hỏi lại gần
 * như y hệt là chuyện thường xuyên.
 *
 * Lưu trong bộ nhớ tiến trình: đủ cho một buổi học và một buổi demo, mất khi
 * restart server. Chuyển sang SQLite là bước sau, không đổi interface này.
 */

export interface CachedAnswer {
  answer: string;
  citations: Citation[];
  confidence: number;
  model?: string;
  provider: string;
  storedAt: number;
}

const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 200;

const store = new Map<string, CachedAnswer>();

/**
 * Từ phủ định phải giữ lại: "attention KHÔNG phải là gì" và "attention là gì"
 * là hai câu khác nhau, gộp chung là trả nhầm câu.
 */
const NEGATIONS = new Set(["khong", "chua", "sai", "khac", "nguoc"]);

const NOISE = new Set([
  "la", "va", "cua", "cho", "mot", "nhung", "duoc", "trong", "voi", "tai", "den",
  "khi", "nay", "thi", "co", "nhu", "de", "ra", "tu", "ve", "gi", "sao", "the",
  "nao", "minh", "ban", "em", "toi", "hay", "hoac", "cac", "cai", "bi", "se",
  "da", "dang", "phai", "can", "hon", "rat", "chi", "a", "an", "is", "are",
  "of", "to", "in", "for", "and", "or", "what", "why", "how",
]);

/**
 * Chữ ký câu hỏi: bỏ dấu, bỏ từ đệm, rồi SẮP XẾP token — nhờ đó "attention là
 * gì" và "gì là attention" ra cùng một chữ ký, còn từ phủ định vẫn giữ nguyên
 * nên không nuốt mất ý nghĩa câu hỏi.
 */
function signature(question: string): string {
  const tokens = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && (NEGATIONS.has(token) || !NOISE.has(token)));

  return Array.from(new Set(tokens)).sort().join(" ");
}

export function cacheKey(
  question: string,
  materialId: string | undefined,
  page: number | undefined,
  model: string,
): string {
  // Gộp trang thành nhóm 5: hỏi cùng câu ở trang 21 hay 22 thường cần cùng
  // câu trả lời, nhưng ở trang 3 thì không.
  const bucket = page ? Math.floor(page / 5) : "none";
  const raw = [signature(question), materialId ?? "none", bucket, model].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function readCache(key: string): CachedAnswer | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.storedAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit;
}

export function writeCache(key: string, value: Omit<CachedAnswer, "storedAt">): void {
  if (store.size >= MAX_ENTRIES) {
    // Map giữ thứ tự chèn nên khoá đầu tiên là khoá cũ nhất.
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { ...value, storedAt: Date.now() });
}

/** Cắt câu trả lời thành chunk để phát lại y như lúc model đang stream. */
export function replayChunks(answer: string, size = 24): string[] {
  const chunks: string[] = [];
  for (let at = 0; at < answer.length; at += size) {
    chunks.push(answer.slice(at, at + size));
  }
  return chunks;
}
