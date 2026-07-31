/**
 * AG-UI protocol qua SSE — đúng shape bản gốc VLearn dùng giữa reader và
 * backend tutor, để phần frontend này drop-in thay được cho nhau.
 */

export interface AguiRequest {
  threadId: string;
  runId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  tools: unknown[];
  context: unknown[];
  forwardedProps?: {
    clientTurnKey?: string;
    conversationId?: string;
    /** Bỏ qua cache, để demo trực tiếp nhìn thấy model chạy thật. */
    skipCache?: boolean;
    /** Mở rộng của mình: ngữ cảnh giàu hơn thay vì nhồi vào chuỗi câu hỏi. */
    scope?: {
      course_id: string;
      lecture_id: string;
      material_id?: string;
      page_number?: number;
      selected_text?: string;
    };
  };
}

export type AguiEvent =
  | { type: "RUN_STARTED"; threadId: string; runId: string }
  | { type: "TEXT_MESSAGE_START"; messageId: string }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TEXT_MESSAGE_END"; messageId: string }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string }
  | { type: "TOOL_CALL_END"; toolCallId: string }
  | { type: "TOOL_CALL_RESULT"; toolCallId: string; content: string }
  | { type: "STATE_SNAPSHOT"; snapshot: Record<string, unknown> }
  | { type: "RUN_FINISHED"; threadId: string; runId: string }
  | { type: "RUN_ERROR"; message: string };

/** Một frame SSE: `data: {json}\n\n` — khớp parser của bản gốc. */
export function encodeAguiEvent(event: AguiEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Đọc SSE stream và yield từng event AG-UI. */
export async function* readAguiStream(response: Response): AsyncGenerator<AguiEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming is not supported by this browser/response.");

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      for (;;) {
        const boundary = buffer.indexOf("\n\n");
        if (boundary === -1) break;
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload) yield JSON.parse(payload) as AguiEvent;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
