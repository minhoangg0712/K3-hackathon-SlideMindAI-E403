import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { encodeAguiEvent, type AguiEvent, type AguiRequest } from "@/lib/agui";
import { loadSlideDocument, searchSlides, type SlideHit } from "@/lib/slide-index";

/** Cần Node runtime để đọc PDF từ ổ đĩa. */
export const runtime = "nodejs";
/** Câu trả lời có thể dài; không để platform cắt stream sớm. */
export const maxDuration = 120;

const MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `Bạn là VLearn Tutor — trợ lý học tập của khóa "VinUni AI Thực Chiến", trả lời cho sinh viên đang đọc slide bài giảng.

Nguyên tắc:
- Trả lời bằng tiếng Việt, giọng thân thiện, gọn và đi thẳng vào vấn đề.
- Ưu tiên tuyệt đối nội dung slide được cung cấp trong <slide_context>. Khi trích, dùng đúng chữ trong slide.
- Slide chỉ là điểm neo, không phải giới hạn: nếu slide nêu một khái niệm nhưng không giải thích đủ, hãy bổ sung kiến thức nền chuẩn xác và nói rõ phần nào là kiến thức bổ sung ngoài slide.
- Chỉ nói "tài liệu không đề cập" khi câu hỏi thực sự nằm ngoài phạm vi môn học, chứ không phải khi slide chỉ thiếu chi tiết.
- Khi giải thích quy trình hoặc công thức, trình bày theo từng bước có số thứ tự.
- Nếu người học bôi đen một đoạn, coi đó là trọng tâm câu hỏi.
- Không bịa số liệu, tên riêng hay trích dẫn không có trong slide.

Cuối câu trả lời, nếu có dùng nội dung slide, thêm một dòng cuối theo đúng định dạng:
[nguồn] trang <số>, trang <số>`;

/**
 * Ghi một event ra stream. Trả về false khi client đã ngắt kết nối — lúc đó
 * enqueue sẽ throw, và ta muốn dừng gọn thay vì ném lỗi giả vào log.
 */
function sse(
  event: AguiEvent,
  controller: ReadableStreamDefaultController<Uint8Array>,
): boolean {
  try {
    controller.enqueue(new TextEncoder().encode(encodeAguiEvent(event)));
    return true;
  } catch {
    return false;
  }
}

/** Đóng stream, bỏ qua trường hợp client đã ngắt trước đó. */
function closeQuietly(controller: ReadableStreamDefaultController<Uint8Array>) {
  try {
    controller.close();
  } catch {
    /* stream đã đóng phía client */
  }
}

/** Ngưỡng nhãn confidence khớp bảng nhãn trên UI. */
function confidenceFrom(hits: SlideHit[], answer: string): number {
  if (hits.length === 0) return answer.length > 0 ? 0.42 : 0.2;
  const best = hits[0].score;
  // Càng nhiều token khớp và càng nhiều trang chứng cứ thì càng tin cậy.
  const coverage = Math.min(1, best / 6) * 0.6 + Math.min(1, hits.length / 3) * 0.3;
  return Math.min(0.95, 0.45 + coverage * 0.5);
}

/**
 * Trả lời dự phòng khi chưa cấu hình API key: KHÔNG gọi model nào, chỉ ghép
 * lại đúng những đoạn slide tìm được. Dùng để phát triển và demo offline;
 * UI luôn hiện nhãn "MOCK" cho câu trả lời này.
 */
function mockAnswer(question: string, hits: SlideHit[], fileName: string): string[] {
  const chunks: string[] = [
    "**Chế độ mock — chưa cấu hình ANTHROPIC_API_KEY, nên đây không phải câu trả lời do AI sinh ra.**\n\n",
  ];

  if (hits.length === 0) {
    chunks.push(
      `Mình không tìm được đoạn nào trong ${fileName || "tài liệu"} khớp với câu hỏi "${question}".\n\n`,
      "Hãy thử bôi đen một đoạn cụ thể trên slide, hoặc đặt ANTHROPIC_API_KEY trong .env.local để Tutor trả lời thật.",
    );
    return chunks;
  }

  chunks.push(
    `Những đoạn liên quan nhất tới "${question}" trong ${fileName}:\n\n`,
    ...hits.map((hit) => `${hit.page}. [trang ${hit.page}] ${hit.quote}\n\n`),
    `[nguồn] ${hits.map((hit) => `trang ${hit.page}`).join(", ")}`,
  );
  return chunks;
}

export async function POST(request: Request) {
  let body: AguiRequest;
  try {
    body = (await request.json()) as AguiRequest;
  } catch {
    return Response.json({ detail: "invalid_json" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // `mock` chỉ để phát triển/demo offline và LUÔN được gán nhãn trên UI —
  // không bao giờ trình bày nó như AI chạy thật.
  const provider: "anthropic" | "mock" =
    process.env.TUTOR_PROVIDER === "mock" || !apiKey ? "mock" : "anthropic";

  const scope = body.forwardedProps?.scope;
  const question = body.messages.at(-1)?.content?.trim() ?? "";
  if (!question) {
    return Response.json({ detail: "empty_question" }, { status: 400 });
  }

  const messageId = `msg_${randomUUID()}`;
  const toolCallId = `tc_${randomUUID()}`;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        sse({ type: "RUN_STARTED", threadId: body.threadId, runId: body.runId }, controller);

        // --- Truy hồi nội dung slide (tool search_slides) -------------------
        let hits: SlideHit[] = [];
        let slideContext = "";
        let fileName = "";

        if (scope?.material_id) {
          sse({ type: "TOOL_CALL_START", toolCallId, toolCallName: "search_slides" }, controller);

          const doc = await loadSlideDocument(scope.material_id);
          if (doc) {
            fileName = doc.fileName;
            const query = [scope.selected_text ?? "", question].join(" ");
            hits = searchSlides(doc, query, scope.page_number);

            // Luôn kèm trang đang mở, kể cả khi không khớp từ khóa nào.
            const current = doc.pages.find((page) => page.page === scope.page_number);
            if (current?.text && !hits.some((hit) => hit.page === current.page)) {
              hits.unshift({ page: current.page, quote: current.text.slice(0, 280), score: 1 });
            }

            slideContext = hits
              .map((hit) => {
                const page = doc.pages.find((item) => item.page === hit.page);
                return `[trang ${hit.page}] ${page?.text.slice(0, 1400) ?? hit.quote}`;
              })
              .join("\n\n");
          }

          sse(
            {
              type: "TOOL_CALL_RESULT",
              toolCallId,
              content:
                hits.map((hit) => `[trang ${hit.page}] ${hit.quote}`).join("\n") ||
                "Không tìm thấy đoạn slide khớp.",
            },
            controller,
          );
          sse({ type: "TOOL_CALL_END", toolCallId }, controller);
        }

        // --- Gọi Claude ----------------------------------------------------
        const contextBlock = [
          fileName ? `Tài liệu: ${fileName}` : "",
          scope?.page_number ? `Người học đang mở trang ${scope.page_number}.` : "",
          scope?.selected_text ? `Đoạn được bôi đen: "${scope.selected_text}"` : "",
          slideContext ? `<slide_context>\n${slideContext}\n</slide_context>` : "",
        ]
          .filter(Boolean)
          .join("\n");

        sse({ type: "TEXT_MESSAGE_START", messageId }, controller);

        let answer = "";
        let usage:
          | { input_tokens: number; output_tokens: number; cache_read_input_tokens: number }
          | undefined;

        const emit = (delta: string) => {
          answer += delta;
          sse({ type: "TEXT_MESSAGE_CONTENT", messageId, delta }, controller);
        };

        if (provider === "mock") {
          for (const chunk of mockAnswer(question, hits, fileName)) {
            emit(chunk);
            await new Promise((resolve) => setTimeout(resolve, 18));
          }
        } else {
          const client = new Anthropic({ apiKey });
          const claudeStream = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            thinking: { type: "adaptive" },
            output_config: { effort: "medium" },
            system: [
              { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
            ],
            messages: [
              { role: "user", content: contextBlock ? `${contextBlock}\n\n${question}` : question },
            ],
          });

          claudeStream.on("text", emit);
          const finalMessage = await claudeStream.finalMessage();

          if (finalMessage.stop_reason === "refusal") {
            sse({ type: "TEXT_MESSAGE_END", messageId }, controller);
            sse({ type: "RUN_ERROR", message: "guardrail_blocked" }, controller);
            closeQuietly(controller);
            return;
          }

          usage = {
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
            cache_read_input_tokens: finalMessage.usage.cache_read_input_tokens ?? 0,
          };
        }

        sse({ type: "TEXT_MESSAGE_END", messageId }, controller);

        // --- Chốt lượt -----------------------------------------------------
        const citedPages = new Set(
          Array.from(answer.matchAll(/trang\s+(\d+)/gi)).map((match) => Number(match[1])),
        );
        const citations = hits
          .filter((hit) => citedPages.size === 0 || citedPages.has(hit.page))
          .map((hit) => ({
            document_title: fileName,
            page: hit.page,
            section: null,
            quote: hit.quote,
          }));

        sse(
          {
            type: "STATE_SNAPSHOT",
            snapshot: {
              message_id: messageId,
              citations,
              confidence: confidenceFrom(hits, answer),
              status: hits.length > 0 ? "answered" : "not_found",
              provider,
              usage,
            },
          },
          controller,
        );
        sse({ type: "RUN_FINISHED", threadId: body.threadId, runId: body.runId }, controller);
        closeQuietly(controller);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "unknown_error";
        console.error("[tutor/agent]", message);
        sse({ type: "RUN_ERROR", message }, controller);
        closeQuietly(controller);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
