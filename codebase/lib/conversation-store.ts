import type { Citation } from "@/lib/types";

/**
 * Lưu hội thoại Tutor ở phía server.
 *
 * Bản gốc để hội thoại trong `sessionStorage` với key
 * `edupulse_chat_conversation:<course>:<lecture>:<material>` — đóng tab là mất
 * sạch, và nút History trên panel không có `onClick` nào.
 *
 * Ở đây giữ trong bộ nhớ tiến trình: F5 hay mở tab khác vẫn đọc lại được, mất
 * khi restart server. Chuyển sang SQLite là bước sau, interface giữ nguyên.
 */

export interface StoredMessage {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
  created_at: string;
}

export interface StoredConversation {
  conversation_id: string;
  course_id?: string;
  material_id?: string;
  day_code?: string | null;
  created_at: string;
  messages: StoredMessage[];
}

const MAX_CONVERSATIONS = 100;
const conversations = new Map<string, StoredConversation>();

export function createConversation(
  id: string,
  meta: { course_id?: string; material_id?: string; day_code?: string | null } = {},
): StoredConversation {
  if (conversations.size >= MAX_CONVERSATIONS) {
    const oldest = conversations.keys().next().value;
    if (oldest) conversations.delete(oldest);
  }
  const record: StoredConversation = {
    conversation_id: id,
    created_at: new Date().toISOString(),
    messages: [],
    ...meta,
  };
  conversations.set(id, record);
  return record;
}

export function getConversation(id: string): StoredConversation | null {
  return conversations.get(id) ?? null;
}

export function listConversations(materialId?: string): StoredConversation[] {
  const all = Array.from(conversations.values()).filter(
    (item) => !materialId || item.material_id === materialId,
  );
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Ghi một lượt hỏi–đáp. Tự tạo hội thoại nếu chưa có, vì client sinh
 * conversation_id trước rồi mới gửi câu hỏi đầu tiên.
 */
export function appendTurn(
  id: string,
  turn: {
    question: string;
    answer: string;
    messageId: string;
    citations?: Citation[];
    confidence?: number;
    course_id?: string;
    material_id?: string;
  },
): void {
  const record =
    conversations.get(id) ??
    createConversation(id, { course_id: turn.course_id, material_id: turn.material_id });

  const now = new Date().toISOString();
  record.messages.push({
    message_id: `${turn.messageId}_q`,
    role: "user",
    content: turn.question,
    created_at: now,
  });
  record.messages.push({
    message_id: turn.messageId,
    role: "assistant",
    content: turn.answer,
    citations: turn.citations,
    confidence: turn.confidence,
    created_at: now,
  });
}
