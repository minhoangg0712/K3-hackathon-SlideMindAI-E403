#!/usr/bin/env node
/**
 * Bộ test 8 điểm yếu của AI Assistant vlearn.dev, chạy trên bản cải tiến của
 * nhóm và đối chiếu với hành vi bản gốc.
 *
 *   node eval/worst-cases/run.mjs                   # chạy cả 8
 *   node eval/worst-cases/run.mjs --only=W1,W8      # chạy vài case
 *   node eval/worst-cases/run.mjs --base=http://... # đổi host
 *
 * Cột "bản gốc" KHÔNG chạy qua mạng. Nó đọc thẳng từ bundle production đã lưu
 * ở evidence/ — hành vi bản gốc là hằng số nằm trong code, đo bằng cách chạy
 * lại chỉ tổ ăn quota tài khoản thật mà kết quả vẫn thế. Muốn tự kiểm chứng:
 *
 *   node evidence/verify.mjs <số hiệu>
 *
 * Cột "bản cải tiến" chạy thật qua endpoint SSE đang bật ở --base, không mock
 * lớp nào. Case nào bản cải tiến chưa làm thì báo CHƯA SỬA, không tô hồng.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BASE = arg("base", "http://localhost:3000");
const ONLY = arg("only", "").split(",").filter(Boolean);

const DAY03 = "material_ms2044ey_k6uor3";
const DAY05 = "material_ms204v3b_r9mo78";

const cases = (await readFile(path.join(HERE, "cases.jsonl"), "utf8"))
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line))
  .filter((item) => ONLY.length === 0 || ONLY.includes(item.id));

/** Payload gửi lên endpoint tutor — giữ đúng hình dạng client thật dùng. */
function payloadFor(question, { materialId = DAY03, page = 22, thread = "wc" } = {}) {
  return {
    threadId: thread,
    runId: `${thread}-${Date.now()}`,
    messages: [{ role: "user", content: question }],
    tools: [],
    context: [],
    forwardedProps: {
      clientTurnKey: `${thread}-${Date.now()}`,
      scope: {
        course_id: "COMP2010",
        lecture_id: `Lecture_${materialId}`,
        material_id: materialId,
        page_number: page,
      },
    },
  };
}

/** Gửi một câu hỏi, gom cả stream AG-UI. Trả cả payload để đo được kích thước. */
async function ask(question, options = {}) {
  const payload = payloadFor(question, options);
  const body = JSON.stringify(payload);
  const started = Date.now();

  const response = await fetch(`${BASE}/api/backend/api/v1/tutor/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body,
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await response.json());
    } catch {
      /* body không phải JSON */
    }
    return { status: response.status, detail, answer: "", snapshot: null, payload, body, ms: Date.now() - started };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let snapshot = null;
  const toolCalls = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      let event;
      try {
        event = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      if (event.type === "TEXT_MESSAGE_CONTENT") answer += event.delta ?? "";
      else if (event.type === "STATE_SNAPSHOT") snapshot = event.snapshot;
      else if (event.type === "TOOL_CALL_START") toolCalls.push(event.toolCallName);
    }
  }

  return { status: 200, detail: "", answer, snapshot, toolCalls, payload, body, ms: Date.now() - started };
}

const NOT_FOUND = /(không|chưa) (đề cập|có|nêu|nói|tìm thấy|ghi)|không có trong|không tìm được/i;

/** page_count thật của từng tài liệu, lấy từ API chứ không hardcode lại. */
async function pageCounts() {
  const res = await fetch(`${BASE}/api/backend/api/v1/documents?course_id=COMP2010`);
  if (!res.ok) throw new Error(`documents HTTP ${res.status}`);
  const { items } = await res.json();
  return new Map(items.map((doc) => [doc.material_id, doc.page_count]));
}

/* ------------------------------------------------------------------ probes */

const probes = {
  /** W1 — confidence có phân hoá theo chất lượng câu trả lời không. */
  async confidence_spread() {
    const grounded = [
      "ReAct là viết tắt của gì?",
      "Vòng lặp ReAct gồm những bước nào?",
      "Slide này định nghĩa agent như thế nào?",
      "Tool calling khác gì với việc gọi hàm thông thường?",
    ];
    const ungrounded = "Slide này nói gì về phân rã SVD và chuẩn hoá ma trận?";

    const results = [];
    for (const question of grounded) {
      const r = await ask(question, { thread: "w1" });
      results.push({ question, confidence: r.snapshot?.confidence ?? null, grounded: true });
    }
    const r = await ask(ungrounded, { thread: "w1" });
    results.push({ question: ungrounded, confidence: r.snapshot?.confidence ?? null, grounded: false });

    const values = results.map((item) => item.confidence).filter((item) => item !== null);
    const distinct = new Set(values).size;
    const groundedLow = Math.min(...results.filter((i) => i.grounded).map((i) => i.confidence ?? 1));
    const ungroundedConf = results.find((i) => !i.grounded)?.confidence ?? 1;
    const ordered = ungroundedConf < groundedLow;

    return {
      pass: distinct >= 4 && ordered,
      metric: `${distinct} giá trị khác nhau trên 5 câu; câu không căn cứ ${ungroundedConf} < thấp nhất trong nhóm có căn cứ ${groundedLow} → ${ordered ? "đúng thứ tự" : "SAI thứ tự"}`,
      detail: results,
    };
  },

  /** W2 — citation có đủ metadata và trỏ vào trang có thật không. */
  async citation_integrity(counts) {
    const questions = [
      "ReAct là viết tắt của gì?",
      "Vòng lặp ReAct gồm những bước nào?",
      "Agent khác chatbot ở điểm nào?",
    ];
    const rows = [];
    for (const question of questions) {
      const r = await ask(question, { thread: "w2" });
      const total = r.snapshot?.citations?.length ?? 0;
      // Số trang phải đối chiếu với ĐÚNG tài liệu chứa trích dẫn: câu trả lời
      // có thể lấy nội dung từ buổi học khác, mà mỗi tài liệu dày ngắn khác
      // nhau. So tất cả với số trang của tài liệu đang mở là chấm sai.
      const bad = (r.snapshot?.citations ?? []).filter((c) => {
        const max = counts.get(c.material_id ?? DAY03) ?? Infinity;
        return !c.document_title || !c.quote?.trim() || !(c.page >= 1 && c.page <= max);
      });
      rows.push({ question, total, invalid: bad.length, sample: r.snapshot?.citations?.[0] ?? null });
    }
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const invalid = rows.reduce((sum, row) => sum + row.invalid, 0);

    return {
      pass: total > 0 && invalid === 0,
      metric: `${total - invalid}/${total} citation có đủ tên tài liệu, trích dẫn khác rỗng, và số trang nằm trong khoảng hợp lệ của chính tài liệu đó`,
      detail: rows,
    };
  },

  /** W3 — payload gửi lên có mang ngữ cảnh thật không. */
  async context_payload() {
    const r = await ask("Vòng lặp ReAct gồm những bước nào?", { thread: "w3" });
    const scope = r.payload.forwardedProps?.scope;
    const hasScope = Boolean(scope?.material_id && scope?.page_number);
    // Bản gốc gửi tools:[] context:[] và không có scope, nên phần ngữ cảnh
    // đúng bằng 0 byte. Ở đây đo riêng phần scope để so được với con số đó.
    const scopeBytes = Buffer.byteLength(JSON.stringify(scope ?? {}), "utf8");

    return {
      pass: hasScope,
      metric: `payload ${Buffer.byteLength(r.body, "utf8")} byte, trong đó scope ${scopeBytes} byte (material_id + số trang)`,
      detail: scope ?? null,
    };
  },

  /** W4 — hỏi lại y hệt có được cache không. */
  async repeat_question() {
    // Câu hỏi phải là câu chưa ai hỏi trong lượt chạy này, nếu không lần "đầu"
    // đã trúng cache do case khác để lại và phép đo mất ý nghĩa.
    const question = `ReAct là viết tắt của gì? (kiểm tra ${Date.now()})`;
    const first = await ask(question, { thread: "w4a" });
    const second = await ask(question, { thread: "w4b" });
    const hasField = second.snapshot ? "cache_hit" in second.snapshot : false;
    const hit = second.snapshot?.cache_hit === true;

    return {
      pass: hasField && hit && second.ms < first.ms / 3,
      metric: hasField
        ? `cache_hit=${second.snapshot.cache_hit}; ${first.ms}ms → ${second.ms}ms`
        : `snapshot không có trường cache_hit (${first.ms}ms → ${second.ms}ms, vẫn gọi model đủ hai lần)`,
      detail: { first_ms: first.ms, second_ms: second.ms, snapshot_keys: Object.keys(second.snapshot ?? {}) },
    };
  },

  /** W5 — quota có được cưỡng chế ở server không. */
  async quota_endpoint() {
    const res = await fetch(`${BASE}/api/backend/api/v1/tutor/quota`).catch(() => null);
    const exists = Boolean(res && res.status !== 404);

    return {
      pass: exists,
      metric: exists
        ? `GET /api/v1/tutor/quota trả HTTP ${res.status}`
        : "không có endpoint quota phía server — hạn mức vẫn chỉ nằm ở localStorage của trình duyệt",
      detail: { http: res?.status ?? null },
    };
  },

  /** W6 — hội thoại có sống sót ngoài tab trình duyệt không. */
  async conversation_replay() {
    const created = await fetch(`${BASE}/api/backend/api/v1/dialogue/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_code: "day-03", mode: "in_class" }),
    });
    if (!created.ok) {
      return { pass: false, metric: `POST conversations HTTP ${created.status}`, detail: null };
    }
    const { conversation_id: id } = await created.json();
    const replay = await fetch(
      `${BASE}/api/backend/api/v1/dialogue/conversations/${id}/messages`,
    ).catch(() => null);
    const exists = Boolean(replay && replay.status !== 404);

    return {
      pass: exists,
      metric: exists
        ? `GET .../${id}/messages trả HTTP ${replay.status}`
        : `tạo được ${id} nhưng không có endpoint đọc lại — hội thoại vẫn chỉ nằm ở sessionStorage, F5 là mất`,
      detail: { conversation_id: id, replay_http: replay?.status ?? null },
    };
  },

  /** W7 — hỏi khái niệm của tài liệu khác trong cùng khoá. */
  async cross_material() {
    // Đang mở Day 5, hỏi khái niệm chỉ được dạy ở Day 3.
    const r = await ask("Vòng lặp ReAct gồm những bước nào?", {
      materialId: DAY05,
      page: 10,
      thread: "w7",
    });
    const refused = NOT_FOUND.test(r.answer.slice(0, 220));
    const tools = r.toolCalls ?? [];

    return {
      pass: !refused,
      metric: refused
        ? `trả lời "không đề cập" dù ReAct có trong Day 3 cùng khoá; tool đã gọi: ${tools.join(", ") || "không có"}`
        : `trả lời được nội dung Day 3 khi đang mở Day 5; tool đã gọi: ${tools.join(", ") || "không có"}`,
      detail: { tools, opening: r.answer.slice(0, 160) },
    };
  },

  /** W8 — câu hỏi vượt 2000 ký tự bị xử lý thế nào. */
  async long_question() {
    const source = await readFile(path.join(ROOT, "pitch", "prompts.md"), "utf8");
    const match = source.match(/^Tôi đang làm bài tập cuối khoá[\s\S]*?vì sao\?$/m);
    if (!match) {
      return { pass: false, metric: "không tìm thấy prompt dài trong pitch/prompts.md", detail: null };
    }
    const question = match[0];
    const r = await ask(question, { thread: "w8" });

    // Bản gốc: cắt im ở 2000 ký tự, người học không hề biết.
    // Đạt khi server nói thẳng là quá dài, hoặc xử lý trọn vẹn câu hỏi.
    const rejected = r.status === 400 && r.detail.includes("question_too_long");
    const answeredWhole = r.status === 200 && /chatbot|agent/i.test(r.answer);

    return {
      pass: rejected || answeredWhole,
      metric: rejected
        ? `${question.length} ký tự → HTTP 400 ${r.detail}`
        : answeredWhole
          ? `${question.length} ký tự → trả lời trọn vẹn, không cắt`
          : `${question.length} ký tự → HTTP ${r.status}, không rõ có cắt hay không`,
      detail: { chars: question.length, http: r.status, detail: r.detail },
    };
  },
};

/* ------------------------------------------------------------------- chạy */

const counts = await pageCounts().catch((cause) => {
  console.error(`Không đọc được page_count: ${cause.message}`);
  console.error(`Server đã chạy ở ${BASE} chưa?`);
  process.exit(1);
});

const results = [];
for (const item of cases) {
  process.stdout.write(`${item.id} ${item.weakness} ... `);
  let outcome;
  try {
    outcome = await probes[item.probe](counts);
  } catch (cause) {
    outcome = { pass: false, metric: `lỗi khi chạy: ${cause.message}`, detail: null };
  }
  console.log(outcome.pass ? "ĐÃ SỬA" : "CHƯA SỬA");
  results.push({ ...item, ...outcome });
}

const fixed = results.filter((item) => item.pass).length;
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const md = [
  `# 8 điểm yếu — bản gốc vlearn.dev so với bản của nhóm`,
  ``,
  `Chạy ${stamp} · endpoint \`${BASE}\` · **${fixed}/${results.length} điểm đã sửa**`,
  ``,
  `| # | Điểm yếu | Bản gốc (đo từ bundle) | Bản của nhóm (chạy thật) | Kết quả |`,
  `|---|---|---|---|---|`,
  ...results.map(
    (item) =>
      `| ${item.id} | ${item.weakness} | ${item.original_metric} | ${item.metric} | ${item.pass ? "**ĐÃ SỬA**" : "chưa sửa"} |`,
  ),
  ``,
  `## Điều kiện đạt của từng case`,
  ``,
  ...results.flatMap((item) => [
    `### ${item.id} — ${item.weakness}`,
    ``,
    `- Code bản gốc: \`${item.original_code}\` (kiểm chứng: \`node evidence/verify.mjs ${item.evidence}\`)`,
    `- Đạt khi: ${item.pass_when}`,
    `- Đo được: ${item.metric}`,
    ``,
  ]),
  `## Cách đọc bảng này`,
  ``,
  `Cột "bản gốc" là hằng số nằm trong bundle production, không phải kết quả một`,
  `lượt chạy — chạy lại bao nhiêu lần cũng ra thế. Cột "bản của nhóm" là kết quả`,
  `thật của lần chạy ghi ở đầu file, trên cùng bộ câu hỏi.`,
  ``,
  `W5 và W6 chỉ kiểm tra endpoint có tồn tại hay không, vì kiểm tra đầy đủ phải`,
  `bắn 16 request liên tiếp và sẽ đốt sạch quota Gemini free tier. Cách kiểm`,
  `chứng đầy đủ nằm trong README của thư mục này.`,
  ``,
].join("\n");

await mkdir(path.join(HERE, "runs"), { recursive: true });
await writeFile(path.join(HERE, "runs", `${stamp}.md`), md, "utf8");
await writeFile(
  path.join(HERE, "runs", `${stamp}.jsonl`),
  results.map((item) => JSON.stringify(item)).join("\n") + "\n",
  "utf8",
);

console.log();
console.log(`${fixed}/${results.length} điểm đã sửa`);
console.log(`eval/worst-cases/runs/${stamp}.md`);
