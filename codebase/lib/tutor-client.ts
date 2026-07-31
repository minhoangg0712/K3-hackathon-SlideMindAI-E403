import { apiFetch, apiUrl, readError } from "@/lib/api-client";
import { readAguiStream, type AguiRequest } from "@/lib/agui";
import type {
  Citation,
  TutorAskRequest,
  TutorFinal,
  TutorProvider,
  TutorScope,
} from "@/lib/types";

const CONVERSATION_PREFIX = "vlearn_tutor_conversation";

function scopeKey(scope: TutorScope): string {
  return [CONVERSATION_PREFIX, scope.course_id, scope.lecture_id, scope.material_id ?? "unscoped"].join(
    ":",
  );
}

/**
 * Conversation id lưu ở localStorage (bản gốc dùng sessionStorage, nên đóng
 * tab là mất hội thoại).
 */
function readConversationId(scope: TutorScope): string | undefined {
  try {
    return localStorage.getItem(scopeKey(scope)) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeConversationId(scope: TutorScope, conversationId: string): void {
  try {
    localStorage.setItem(scopeKey(scope), conversationId);
  } catch {
    /* private mode */
  }
}

export function clearConversation(scope: TutorScope): void {
  try {
    localStorage.removeItem(scopeKey(scope));
  } catch {
    /* private mode */
  }
}

async function ensureConversation(request: TutorAskRequest): Promise<string> {
  if (request.force_new_conversation) clearConversation(request);
  else {
    const existing = request.conversation_id ?? readConversationId(request);
    if (existing) return existing;
  }

  const response = await apiFetch("/api/v1/dialogue/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day_code: request.lecture_id, mode: "in_class" }),
  });
  if (!response.ok) throw new Error(await readError(response));

  const body = (await response.json()) as { conversation_id: string };
  writeConversationId(request, body.conversation_id);
  return body.conversation_id;
}

/** Ánh xạ mã lỗi backend sang thông báo tiếng Việt, giống bản gốc. */
function describeError(status: number, detail?: string): string {
  switch (detail) {
    case "tutor_blocked_active_quiz":
      return "Không thể hỏi AI khi đang trong bài kiểm tra.";
    case "turn_in_progress":
      return "Trợ lý đang xử lý câu hỏi trước đó, vui lòng đợi.";
    case "turn_failed":
      return "Lượt hỏi trước đã thất bại. Vui lòng gửi câu hỏi mới.";
    case "content_unpublished":
      return "Nội dung ngày học chưa được xuất bản.";
    case "guardrail_blocked":
      return "Câu hỏi không phù hợp với chính sách sử dụng.";
    case "rate_limited":
      return "Bạn đã dùng hết lượt hỏi AI hôm nay.";
    default:
      break;
  }
  if (detail) return detail;
  if (status === 404) return "Không tìm thấy hội thoại hoặc ngày học.";
  if (status === 503) return "Hệ thống AI đang bận, vui lòng thử lại sau ít phút.";
  return "Trợ lý AI gặp sự cố. Vui lòng thử lại.";
}

function describeRunError(code: string): string {
  switch (code) {
    case "timeout":
      return "Trợ lý AI phản hồi quá lâu. Vui lòng thử lại.";
    case "output_ceiling":
      return "Câu trả lời quá dài. Vui lòng đặt câu hỏi ngắn gọn hơn.";
    case "cancelled":
      return "Yêu cầu đã bị huỷ.";
    case "lease_lost":
      return "Phiên hội thoại đã bị gián đoạn. Vui lòng thử lại.";
    case "guardrail_blocked":
      return "Câu hỏi không phù hợp với chính sách sử dụng.";
    default:
      return code || "Trợ lý AI gặp sự cố. Vui lòng thử lại.";
  }
}

function newId(prefix: string): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random()}`;
}

export interface AskHandlers {
  onDelta: (delta: string) => void;
  onFinal: (final: TutorFinal) => void;
  onError: (message: string) => void;
}

export async function askTutor(request: TutorAskRequest, handlers: AskHandlers): Promise<void> {
  let conversationId: string;
  try {
    conversationId = await ensureConversation(request);
  } catch (cause) {
    handlers.onError(cause instanceof Error ? cause.message : "Không thể tạo phiên hội thoại.");
    return;
  }

  const runId = newId("run");
  let answer = "";
  let messageIdFromState: string | null = null;
  let citations: Citation[] = [];
  let confidence = 0.4;
  let status: TutorFinal["status"] = "answered";
  let provider: TutorProvider = "mock";

  const payload: AguiRequest = {
    threadId: conversationId,
    runId,
    // Ngữ cảnh đi trong forwardedProps.scope thay vì nhồi "(Trang N)" vào câu hỏi.
    messages: [{ role: "user", content: request.user_question }],
    tools: [],
    context: [],
    forwardedProps: {
      clientTurnKey: newId("ck"),
      conversationId,
      scope: {
        course_id: request.course_id,
        lecture_id: request.lecture_id,
        material_id: request.material_id,
        page_number: request.page_number,
        selected_text: request.selected_text,
      },
    },
  };

  try {
    const response = await fetch(apiUrl("/api/v1/tutor/agent"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail: string | undefined;
      try {
        detail = (await response.json())?.detail;
      } catch {
        detail = undefined;
      }
      handlers.onError(describeError(response.status, detail));
      return;
    }

    for await (const event of readAguiStream(response)) {
      switch (event.type) {
        case "TEXT_MESSAGE_CONTENT":
          answer += event.delta;
          handlers.onDelta(event.delta);
          break;
        case "STATE_SNAPSHOT": {
          const snapshot = event.snapshot as {
            message_id?: string;
            citations?: Citation[];
            confidence?: number;
            status?: TutorFinal["status"];
            provider?: TutorProvider;
          };
          if (typeof snapshot.message_id === "string") messageIdFromState = snapshot.message_id;
          if (Array.isArray(snapshot.citations)) citations = snapshot.citations;
          if (typeof snapshot.confidence === "number") confidence = snapshot.confidence;
          if (snapshot.status) status = snapshot.status;
          if (snapshot.provider) provider = snapshot.provider;
          break;
        }
        case "RUN_FINISHED":
          handlers.onFinal({
            message_id: messageIdFromState,
            answer,
            citations,
            confidence,
            status,
            conversation_id: conversationId,
            provider,
            memory_used: false,
            cache_hit: false,
          });
          return;
        case "RUN_ERROR":
          handlers.onError(describeRunError(event.message));
          return;
        default:
          break;
      }
    }

    handlers.onError("Stream ended unexpectedly.");
  } catch (cause) {
    handlers.onError(cause instanceof Error ? cause.message : "Streaming failed.");
  }
}

export async function rateAnswer(messageId: string, rating: "up" | "down"): Promise<void> {
  await apiFetch(`/api/v1/dialogue/messages/${encodeURIComponent(messageId)}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: JSON.stringify({ rating }),
  });
}

/* ------------------------------------------------------------------ */
/* Quota                                                              */
/* ------------------------------------------------------------------ */

/**
 * Bản gốc chốt cứng 15 câu/ngày trong bundle. Ở đây để ngoài env vì lúc demo
 * hoặc chạy eval mà hết lượt là tắc, trong khi quota này nằm ở localStorage
 * nên nó chưa từng là hàng rào thật — chỉ là bộ đếm trên máy người dùng.
 * Đặt NEXT_PUBLIC_TUTOR_DAILY_LIMIT=0 để bỏ giới hạn.
 */
export const TUTOR_DAILY_LIMIT =
  Number.parseInt(process.env.NEXT_PUBLIC_TUTOR_DAILY_LIMIT ?? "15", 10) || 0;

/** Đúng công thức key của bản gốc, để scripts/reset-quota.mjs sinh lại được. */
export function quotaKey(email: string): string {
  return `vlearn_quota_${email.toLowerCase()}_${new Date().toISOString().split("T")[0]}`;
}

export function readQuota(email = "anonymous"): { usedCount: number; maxLimit: number } {
  let usedCount = 0;
  try {
    usedCount = Number.parseInt(localStorage.getItem(quotaKey(email)) ?? "0", 10) || 0;
  } catch {
    usedCount = 0;
  }
  return { usedCount, maxLimit: TUTOR_DAILY_LIMIT };
}

export function bumpQuota(email = "anonymous"): number {
  const next = readQuota(email).usedCount + 1;
  try {
    localStorage.setItem(quotaKey(email), String(next));
  } catch {
    /* private mode */
  }
  return next;
}
