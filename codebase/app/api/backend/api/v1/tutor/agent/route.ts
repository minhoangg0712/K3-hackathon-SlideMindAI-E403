import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { encodeAguiEvent, type AguiEvent, type AguiRequest } from "@/lib/agui";
import { loadSlideDocument, searchSlides, type SlideHit } from "@/lib/slide-index";

/** Cần Node runtime để đọc PDF từ ổ đĩa. */
export const runtime = "nodejs";
/** Câu trả lời có thể dài; không để platform cắt stream sớm. */
export const maxDuration = 120;

/**
 * Cascade model: bậc trước hết quota hoặc lỗi thì tụt xuống bậc sau, cuối
 * cùng mới là `mock`. Free tier của Gemini siết theo ngày và Google không
 * còn công bố hạn mức, nên không hardcode một model duy nhất.
 */
const MODEL_CASCADE = (process.env.GEMINI_MODEL_CASCADE ?? "gemini-2.5-flash,gemini-2.5-flash-lite")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

/**
 * Câu hỏi dài hơn ngưỡng này bị từ chối tường minh.
 * Bản gốc `slice(0,2e3)` âm thầm và người học không hề biết mình mất chữ.
 */
export const QUESTION_MAX_CHARS = 2000;

const SYSTEM_PROMPT = `Bạn là VLearn Tutor — trợ lý học tập của khóa "VinUni AI Thực Chiến", trả lời cho sinh viên đang đọc slide bài giảng.

Nguyên tắc:
- Trả lời bằng tiếng Việt, giọng thân thiện, gọn và đi thẳng vào vấn đề.
- Ưu tiên tuyệt đối nội dung slide được cung cấp trong <slide_context>. Khi trích, dùng đúng chữ trong slide.
- Slide chỉ là điểm neo, không phải giới hạn: nếu slide nêu một khái niệm nhưng không giải thích đủ, hãy bổ sung kiến thức nền chuẩn xác và nói rõ phần nào là kiến thức bổ sung ngoài slide.
- Chỉ nói "tài liệu không đề cập" khi câu hỏi thực sự nằm ngoài phạm vi môn học, chứ không phải khi slide chỉ thiếu chi tiết.
- Khi giải thích quy trình hoặc công thức, trình bày theo từng bước có số thứ tự.
- Nếu người học bôi đen một đoạn, coi đó là trọng tâm câu hỏi.
- Không bịa số liệu, tên riêng hay trích dẫn không có trong slide.

Khi thông tin người học hỏi KHÔNG có trong <slide_context> và cũng không phải kiến thức
nền chắc chắn, hãy nói thẳng là slide không đề cập. Thà nói không biết còn hơn bịa.
Đặc biệt với tên người, số liệu, ngày tháng: nếu slide chỉ ghi placeholder hoặc bỏ trống,
phải nói rõ slide không có thông tin đó — tuyệt đối không suy đoán.

Liêm chính học thuật: KHÔNG giải hộ bài kiểm tra, bài tập tính điểm, không đưa đáp án
trắc nghiệm, không viết hộ bài nộp. Gặp yêu cầu đó thì từ chối ngắn gọn và đề nghị
hướng dẫn cách tự làm.
Ranh giới: giải thích, so sánh, tóm tắt nội dung bài giảng là việc BÌNH THƯỜNG phải
làm — đừng nhầm câu hỏi ôn tập với yêu cầu làm hộ bài.

QUY TẮC HỎI LẠI (ưu tiên cao hơn mọi quy tắc trả lời ở trên):
Nếu câu hỏi không nêu rõ đối tượng cụ thể — ví dụ chỉ có "cái này", "phần vừa rồi",
"cho ví dụ", "giải thích thêm", hoặc một câu cụt không có danh từ chỉ khái niệm — thì
KHÔNG được trả lời nội dung, kể cả khi bạn đoán được người học có thể đang hỏi gì.
Trong trường hợp đó, trả lời ĐÚNG MỘT CÂU HỎI NGẮN dưới 40 từ để làm rõ, liệt kê tối đa
3 khả năng có trên trang hiện tại, và KẾT THÚC BẰNG DẤU HỎI. Không kèm giải thích,
không kèm trích dẫn, không kèm dòng [nguồn].
Ví dụ đúng: "Bạn đang hỏi về khối Perception, khối Memory, hay toàn bộ sơ đồ kiến trúc
agent ở trang 17?"

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

  const apiKey = process.env.GEMINI_API_KEY;
  // `mock` chỉ để phát triển/demo offline và LUÔN được gán nhãn trên UI —
  // không bao giờ trình bày nó như AI chạy thật.
  const provider: "gemini" | "mock" =
    process.env.TUTOR_PROVIDER === "mock" || !apiKey ? "mock" : "gemini";

  const scope = body.forwardedProps?.scope;
  const question = body.messages.at(-1)?.content?.trim() ?? "";
  if (!question) {
    return Response.json({ detail: "empty_question" }, { status: 400 });
  }
  // Từ chối tường minh thay vì cắt câm: người học biết mình cần rút gọn.
  if (question.length > QUESTION_MAX_CHARS) {
    return Response.json(
      { detail: "question_too_long", limit: QUESTION_MAX_CHARS, actual: question.length },
      { status: 400 },
    );
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
        /** Model thực sự trả lời — UI hiển thị đúng cái này, không hardcode. */
        let modelUsed: string | undefined;
        /** True khi phải tụt xuống bậc cascade thấp hơn; người dùng được báo. */
        let degraded = false;

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
          const client = new GoogleGenAI({ apiKey });

          // Ngữ cảnh đi trong block riêng, câu hỏi giữ nguyên văn trong
          // <question> — không ghép chuỗi, nên không có gì đẩy đuôi câu hỏi
          // ra ngoài giới hạn như bản gốc.
          const prompt = contextBlock
            ? `${contextBlock}\n\n<question>\n${question}\n</question>`
            : `<question>\n${question}\n</question>`;

          let lastError: unknown;
          let answered = false;

          for (const candidate of MODEL_CASCADE) {
            try {
              const responseStream = await client.models.generateContentStream({
                model: candidate,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                  systemInstruction: SYSTEM_PROMPT,
                  temperature: 0.2,
                  maxOutputTokens: 4096,
                },
              });

              let usageMeta: { promptTokenCount?: number; candidatesTokenCount?: number; cachedContentTokenCount?: number } | undefined;
              for await (const chunk of responseStream) {
                if (chunk.text) emit(chunk.text);
                if (chunk.usageMetadata) usageMeta = chunk.usageMetadata;
              }

              modelUsed = candidate;
              degraded = candidate !== MODEL_CASCADE[0];
              usage = {
                input_tokens: usageMeta?.promptTokenCount ?? 0,
                output_tokens: usageMeta?.candidatesTokenCount ?? 0,
                cache_read_input_tokens: usageMeta?.cachedContentTokenCount ?? 0,
              };
              answered = true;
              break;
            } catch (cause) {
              lastError = cause;
              // Bậc này hỏng (hết quota, model không khả dụng) — thử bậc sau.
              console.warn(`[tutor/agent] model ${candidate} lỗi:`, String(cause).slice(0, 200));
            }
          }

          if (!answered) {
            const message = String(lastError);
            const code = /429|RESOURCE_EXHAUSTED|quota/i.test(message) ? "rate_limited" : "turn_failed";
            sse({ type: "TEXT_MESSAGE_END", messageId }, controller);
            sse({ type: "RUN_ERROR", message: code }, controller);
            closeQuietly(controller);
            return;
          }
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
              model: modelUsed,
              degraded,
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
