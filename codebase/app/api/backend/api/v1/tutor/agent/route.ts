import { GoogleGenAI } from "@google/genai";
import { randomUUID } from "node:crypto";
import { encodeAguiEvent, type AguiEvent, type AguiRequest } from "@/lib/agui";
import { cacheKey, readCache, replayChunks, writeCache } from "@/lib/answer-cache";
import { appendTurn } from "@/lib/conversation-store";
import {
  loadSlideDocument,
  searchCourse,
  searchSlides,
  warmCourseIndex,
  type CourseHit,
  type SlideHit,
} from "@/lib/slide-index";

// Nạp trước chỉ mục cả khoá ngay khi route được load, để tool search_course có
// dữ liệu mà tìm. Không await — request đầu tiên không phải chờ.
warmCourseIndex("COMP2010");

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
 * Nhiều API key, xoay vòng khi key trước hết hạn mức.
 *
 * Free tier siết theo NGÀY và chỉ reset lúc nửa đêm giờ Thái Bình Dương —
 * cạn quota lúc chuẩn bị demo thì không có cách nào chờ kịp. Mỗi key là một
 * tài khoản Google riêng nên có hạn mức riêng.
 *
 *   GEMINI_API_KEY_POOL=key1,key2   (ưu tiên)
 *   GEMINI_API_KEY=key              (một key, như cũ)
 */
const API_KEYS = (process.env.GEMINI_API_KEY_POOL ?? process.env.GEMINI_API_KEY ?? "")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

/** Bậc thử: mỗi model nhân với mỗi key, model rẻ trước rồi mới đổi key. */
const ATTEMPTS = API_KEYS.flatMap((apiKey, keyIndex) =>
  MODEL_CASCADE.map((model) => ({ apiKey, model, keyIndex })),
).sort((a, b) => a.keyIndex - b.keyIndex);

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
- Nếu có khối <slide_khac_trong_khoa>, đó là nội dung lấy từ buổi học KHÁC của cùng khóa. Được phép dùng để trả lời, nhưng phải nói rõ nó nằm ở tài liệu nào — ví dụ "phần này nằm ở day03, trang 22". TUYỆT ĐỐI không nói "tài liệu không đề cập" khi khối này có câu trả lời.
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

/**
 * Câu trả lời tự nhận là không tìm thấy thông tin. Nhận diện ở 220 ký tự đầu
 * vì một lời từ chối tốt thường kèm luôn phần giải thích hợp lệ ngay sau đó.
 */
const SAYS_NOT_FOUND =
  /(không|chưa) (đề cập|có|nêu|nói|tìm thấy|ghi)|không có trong|không tìm được|nằm ngoài phạm vi/i;

/**
 * Confidence hợp thành từ ba tín hiệu, NHÂN chứ không cộng.
 *
 * Bản gốc để `confidence: citations.length ? .85 : .6` — hai hằng số, không
 * liên quan gì tới việc câu trả lời có đúng hay không. Bản đầu của nhóm khá
 * hơn nhưng vẫn cộng có trọng số, nên một câu "slide không đề cập" vẫn được
 * 0.75 chỉ vì tìm ra vài trang khớp từ khoá lặt vặt — cao hơn cả câu trả lời
 * có căn cứ hẳn hoi. Nhân thì một tín hiệu bằng 0 kéo cả tích về 0, nên điểm
 * cao đòi hỏi ĐỒNG THỜI: tìm được nguồn, nguồn đủ mạnh, và có trả lời thật.
 */
function confidenceFrom(hits: SlideHit[], answer: string): number {
  if (answer.length === 0) return 0.2;

  // R — có tìm được nguồn không, nguồn mạnh tới đâu.
  // score >= 2 nghĩa là khớp từ hai token nội dung trở lên, không phải trúng
  // nhờ được cộng điểm vì nằm cạnh trang đang đọc.
  const strong = hits.filter((hit) => hit.score >= 2);
  const best = strong[0]?.score ?? 0;
  const retrieval = Math.min(1, best / 5) * 0.75 + Math.min(1, strong.length / 3) * 0.25;

  // G — câu trả lời có bám vào nguồn không. Tự nhận không tìm thấy thì tín
  // hiệu này phải sụp, đó chính là chỗ bản trước xếp hạng ngược.
  const grounded = SAYS_NOT_FOUND.test(answer.slice(0, 220)) ? 0.12 : 1;

  // C — có trích dẫn trang cụ thể trong câu trả lời không.
  const cited = /trang\s+\d+/i.test(answer) ? 1 : 0.7;

  const raw = Math.pow(Math.max(retrieval, 0.05), 0.55) * grounded * cited;
  return Math.max(0.05, Math.min(0.95, Number(raw.toFixed(2))));
}

/**
 * Trả lời dự phòng khi chưa cấu hình API key: KHÔNG gọi model nào, chỉ ghép
 * lại đúng những đoạn slide tìm được. Dùng để phát triển và demo offline;
 * UI luôn hiện nhãn "MOCK" cho câu trả lời này.
 */
function mockAnswer(question: string, hits: SlideHit[], fileName: string): string[] {
  const chunks: string[] = [
    "**Chế độ mock — chưa cấu hình GEMINI_API_KEY, nên đây không phải câu trả lời do AI sinh ra.**\n\n",
  ];

  if (hits.length === 0) {
    chunks.push(
      `Mình không tìm được đoạn nào trong ${fileName || "tài liệu"} khớp với câu hỏi "${question}".\n\n`,
      "Hãy thử bôi đen một đoạn cụ thể trên slide, hoặc đặt GEMINI_API_KEY trong .env.local để Tutor trả lời thật.",
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

  // `mock` chỉ để phát triển/demo offline và LUÔN được gán nhãn trên UI —
  // không bao giờ trình bày nó như AI chạy thật.
  const provider: "gemini" | "mock" =
    process.env.TUTOR_PROVIDER === "mock" || ATTEMPTS.length === 0 ? "mock" : "gemini";

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

  // Chữ ký câu hỏi đã sắp xếp token, nên "attention là gì" và "gì là
  // attention" dùng chung một ô cache; từ phủ định vẫn được giữ.
  const key = cacheKey(question, scope?.material_id, scope?.page_number, MODEL_CASCADE[0] ?? "mock");
  const cached = body.forwardedProps?.skipCache ? null : readCache(key);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        sse({ type: "RUN_STARTED", threadId: body.threadId, runId: body.runId }, controller);

        // --- Trả lại từ cache ----------------------------------------------
        // Phát lại đúng chuỗi event như một lượt thật để UI không phải biết
        // mình đang xem bản lưu; khác biệt duy nhất là cache_hit và độ trễ.
        if (cached) {
          sse({ type: "TEXT_MESSAGE_START", messageId }, controller);
          for (const delta of replayChunks(cached.answer)) {
            sse({ type: "TEXT_MESSAGE_CONTENT", messageId, delta }, controller);
            await new Promise((resolve) => setTimeout(resolve, 6));
          }
          sse({ type: "TEXT_MESSAGE_END", messageId }, controller);
          sse(
            {
              type: "STATE_SNAPSHOT",
              snapshot: {
                message_id: messageId,
                citations: cached.citations,
                confidence: cached.confidence,
                status: cached.citations.length > 0 ? "answered" : "not_found",
                provider: cached.provider,
                model: cached.model,
                degraded: false,
                cache_hit: true,
              },
            },
            controller,
          );
          sse({ type: "RUN_FINISHED", threadId: body.threadId, runId: body.runId }, controller);
          closeQuietly(controller);
          return;
        }

        // --- Truy hồi nội dung slide (tool search_slides) -------------------
        let hits: SlideHit[] = [];
        let slideContext = "";
        let fileName = "";
        /** Đoạn tìm được ở tài liệu KHÁC trong cùng khoá (tool search_course). */
        let courseHits: CourseHit[] = [];

        const query = [scope?.selected_text ?? "", question].join(" ");

        if (scope?.material_id) {
          sse({ type: "TOOL_CALL_START", toolCallId, toolCallName: "search_slides" }, controller);

          const doc = await loadSlideDocument(scope.material_id);
          if (doc) {
            fileName = doc.fileName;
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

          // --- Tìm sang tài liệu khác cùng khoá (tool search_course) --------
          if (scope.course_id) {
            const courseCallId = `tc_${randomUUID()}`;
            sse(
              { type: "TOOL_CALL_START", toolCallId: courseCallId, toolCallName: "search_course" },
              controller,
            );

            // Giữ đoạn ở tài liệu khác khi nó khớp thật sự (từ hai token nội
            // dung trở lên). Không so với bestLocal: cách chấm hiện tại đếm
            // token có/không nên "react" và "bước" nặng ngang nhau, tài liệu
            // đang mở dễ ăn điểm nhờ mấy từ chung mà chẳng nói gì về khái niệm.
            courseHits = (await searchCourse(scope.course_id, scope.material_id, query)).filter(
              (hit) => hit.score >= 2,
            );

            sse(
              {
                type: "TOOL_CALL_RESULT",
                toolCallId: courseCallId,
                content:
                  courseHits
                    .map((hit) => `[${hit.fileName} trang ${hit.page}] ${hit.quote}`)
                    .join("\n") || "Không tài liệu nào khác trong khoá nhắc tới nội dung này.",
              },
              controller,
            );
            sse({ type: "TOOL_CALL_END", toolCallId: courseCallId }, controller);

            if (courseHits.length > 0) {
              const block = courseHits
                .map((hit) => `[${hit.fileName} · trang ${hit.page}] ${hit.quote}`)
                .join("\n\n");
              slideContext = [
                slideContext,
                `<slide_khac_trong_khoa>\n${block}\n</slide_khac_trong_khoa>`,
              ]
                .filter(Boolean)
                .join("\n\n");
            }
          }
        }

        // --- Gọi Gemini ----------------------------------------------------
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
          // Ngữ cảnh đi trong block riêng, câu hỏi giữ nguyên văn trong
          // <question> — không ghép chuỗi, nên không có gì đẩy đuôi câu hỏi
          // ra ngoài giới hạn như bản gốc.
          const prompt = contextBlock
            ? `${contextBlock}\n\n<question>\n${question}\n</question>`
            : `<question>\n${question}\n</question>`;

          let lastError: unknown;
          let answered = false;

          for (const { apiKey: candidateKey, model: candidate } of ATTEMPTS) {
            const client = new GoogleGenAI({ apiKey: candidateKey });
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
              degraded = candidate !== MODEL_CASCADE[0] || candidateKey !== API_KEYS[0];
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

        // Đoạn lấy từ tài liệu khác cũng phải hiện thành nguồn, nếu không người
        // học không biết câu trả lời đến từ buổi nào.
        for (const hit of courseHits) {
          citations.push({
            document_title: hit.fileName,
            page: hit.page,
            section: null,
            quote: hit.quote,
          });
        }

        const confidence = confidenceFrom(hits, answer);

        if (answer.trim()) {
          writeCache(key, {
            answer,
            citations,
            confidence,
            model: modelUsed,
            provider,
          });

          // Lưu ở server để F5 hay mở tab khác vẫn đọc lại được lượt này.
          const conversationId = body.forwardedProps?.conversationId;
          if (conversationId) {
            appendTurn(conversationId, {
              question,
              answer,
              messageId,
              citations,
              confidence,
              course_id: scope?.course_id,
              material_id: scope?.material_id,
            });
          }
        }

        sse(
          {
            type: "STATE_SNAPSHOT",
            snapshot: {
              message_id: messageId,
              citations,
              confidence,
              status: hits.length > 0 || courseHits.length > 0 ? "answered" : "not_found",
              provider,
              model: modelUsed,
              degraded,
              usage,
              cache_hit: false,
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
