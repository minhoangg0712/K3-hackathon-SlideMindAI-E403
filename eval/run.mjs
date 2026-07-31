#!/usr/bin/env node
/**
 * Chạy toàn bộ eval/golden_set.jsonl qua endpoint tutor THẬT (SSE, không mock
 * lớp nào), chấm từng câu, rồi ghi kết quả ra eval/runs/<timestamp>.jsonl và
 * một bảng markdown có đủ cả câu fail.
 *
 *   node eval/run.mjs                      # mặc định http://localhost:3000
 *   node eval/run.mjs --base=http://...    # đổi host
 *   node eval/run.mjs --only=g10,g13       # chạy vài câu
 *
 * Cách chấm (tự động, không có người ở giữa):
 *   - must_include: mọi chuỗi phải xuất hiện trong câu trả lời (không phân biệt hoa thường)
 *   - must_not_include: không chuỗi nào được xuất hiện
 *   - expect_status: đối chiếu với trạng thái suy ra từ nội dung trả lời
 * Câu đạt = thoả cả ba. Ghi cả lý do fail để phân tích.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BASE = arg("base", "http://localhost:3000");
const ONLY = arg("only", "").split(",").filter(Boolean);
/** Nghỉ giữa hai câu, tránh dính giới hạn theo phút của free tier. */
const DELAY_MS = Number(arg("delay", "6000"));

const cases = (await readFile(path.join(HERE, "golden_set.jsonl"), "utf8"))
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line))
  .filter((item) => ONLY.length === 0 || ONLY.includes(item.id));

/** Gửi một câu hỏi và gom toàn bộ stream AG-UI lại. */
async function ask(item) {
  const started = Date.now();
  const response = await fetch(`${BASE}/api/backend/api/v1/tutor/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      threadId: `eval-${item.id}`,
      runId: `run-${item.id}-${Date.now()}`,
      messages: [{ role: "user", content: item.question }],
      tools: [],
      context: [],
      forwardedProps: {
        clientTurnKey: `eval-${item.id}`,
        // Bộ này đo chất lượng câu trả lời của model, nên phải gọi model thật.
        // Ăn cache thì lượt chạy chỉ đang chấm lại kết quả của lượt trước.
        skipCache: true,
        scope: {
          course_id: "COMP2010",
          lecture_id: "eval",
          material_id: item.material_id,
          page_number: item.page,
        },
      },
    }),
  });

  if (!response.ok) {
    let detail = "";
    try { detail = JSON.stringify(await response.json()); } catch { /* body rỗng */ }
    return { answer: "", snapshot: null, error: `HTTP ${response.status} ${detail}`, ms: Date.now() - started };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let snapshot = null;
  let error = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (;;) {
      const at = buffer.indexOf("\n\n");
      if (at === -1) break;
      const frame = buffer.slice(0, at);
      buffer = buffer.slice(at + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        const event = JSON.parse(payload);
        if (event.type === "TEXT_MESSAGE_CONTENT") answer += event.delta;
        else if (event.type === "STATE_SNAPSHOT") snapshot = event.snapshot;
        else if (event.type === "RUN_ERROR") error = event.message;
      }
    }
  }

  return { answer, snapshot, error, ms: Date.now() - started };
}

/**
 * Suy ra trạng thái từ chính câu trả lời. Cố ý KHÔNG đọc `snapshot.status`
 * vì đó là thứ ta đang muốn kiểm chứng — chấm bằng nó là tự chấm mình.
 */
function inferStatus(answer) {
  const text = answer.toLowerCase();
  // Chỉ xét phần MỞ ĐẦU cho hai trạng thái từ chối: một câu trả lời dài và
  // đúng vẫn có thể chứa "không thể" ở giữa khi nó đang giải thích nội dung
  // slide. Xét toàn văn thì câu đúng bị chấm nhầm thành từ chối.
  const opening = text.slice(0, 220);

  // Xét từ chối TRƯỚC: một lời từ chối tốt thường kèm luôn phần giải thích
  // hợp lệ ngay sau, và ta muốn nó tính refused chứ không phải answered.
  if (/không thể (giúp|hỗ trợ|đưa|cung cấp|viết|làm|giải)|không được phép|(mình|tôi) không (giúp|viết|làm)|không hỗ trợ (việc|giải)|liêm chính học thuật/.test(opening)) return "refused";

  // "chưa được điền", "để trống", "placeholder" đều là cách nói slide không có
  // thông tin đó — tính not_found thay vì bắt đúng chữ "không đề cập".
  // NHƯNG "slide chưa nói tới, mình bổ sung kiến thức nền:" mở đầu y hệt một
  // lời từ chối rồi lại trả lời đầy đủ phía sau — đó là answered, không phải
  // not_found. Phân biệt bằng việc có tự khai dùng kiến thức ngoài slide và
  // câu trả lời có dài ra hay không.
  const usesBackground =
    /bổ sung|kiến thức nền|ngoài slide|ngoài tài liệu/.test(text.slice(0, 400)) &&
    answer.length > 220;
  // Phải nhắc tới slide/tài liệu thì mới tính là "slide không có thông tin".
  // Bắt trần "không có" là chấm sai câu trả lời đúng: hỏi "khi nào KHÔNG nên
  // dùng agent" thì câu trả lời chuẩn cũng chứa "không có tool nào để gọi".
  const notFound =
    /(slide|tài liệu|bài giảng|trang \d+|nội dung)[^.!?\n]{0,60}(không|chưa) (hề |nào )?(đề cập|có|nêu|nói|ghi|nhắc|trình bày|cung cấp)/.test(
      opening,
    ) ||
    /(không|chưa) (hề )?(đề cập|tìm thấy|được nêu|được ghi|được trình bày)/.test(opening) ||
    /chưa (được )?điền|để trống|placeholder/.test(opening);

  if (!usesBackground && notFound) return "not_found";

  // Hỏi lại: câu ngắn, kết thúc bằng dấu hỏi, và không kèm cả một bài giảng.
  // Bỏ dòng [nguồn] ở cuối trước khi xét — model hay đính kèm nó ngay cả khi
  // đang hỏi lại, và khi đó dấu hỏi không còn nằm ở ký tự cuối chuỗi nữa.
  const trimmed = answer.replace(/\n*\[nguồn\][^\n]*$/i, "").trim();
  if (trimmed.endsWith("?") && trimmed.length < 400) return "clarify";

  return "answered";
}

function grade(item, answer) {
  const text = answer.toLowerCase();
  const reasons = [];

  for (const needle of item.must_include ?? []) {
    if (!text.includes(needle.toLowerCase())) reasons.push(`thiếu "${needle}"`);
  }
  for (const needle of item.must_not_include ?? []) {
    if (text.includes(needle.toLowerCase())) reasons.push(`chứa cấm "${needle}"`);
  }

  const actual = inferStatus(answer);
  // `refused` và `not_found` đều là "không trả lời nội dung" — với câu forbidden
  // thì từ chối kiểu nào cũng đạt, miễn không đưa ra thứ bị cấm.
  const statusOk =
    actual === item.expect_status ||
    (item.expect_status === "refused" && actual === "not_found");
  if (!statusOk) reasons.push(`trạng thái ${actual}, cần ${item.expect_status}`);

  return { pass: reasons.length === 0, reasons, actual };
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
await mkdir(path.join(HERE, "runs"), { recursive: true });
const rows = [];

console.log(`Chạy ${cases.length} câu qua ${BASE}\n`);

let first = true;
for (const item of cases) {
  // Free tier siết theo phút. Bắn 24 request liên tiếp là dính 429 giữa chừng
  // và lượt chạy hỏng, phải chạy lại từ đầu — thà chậm còn hơn mất cả lượt.
  if (!first) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  first = false;

  const { answer, snapshot, error, ms } = await ask(item);
  const result = error
    ? { pass: false, reasons: [`lỗi: ${error}`], actual: "error" }
    : grade(item, answer);

  rows.push({
    id: item.id, kind: item.kind, source: item.source, question: item.question,
    expect_status: item.expect_status, actual_status: result.actual,
    pass: result.pass, reasons: result.reasons, ms,
    confidence: snapshot?.confidence ?? null,
    model: snapshot?.model ?? snapshot?.provider ?? null,
    citations: (snapshot?.citations ?? []).length,
    answer: answer.slice(0, 1200),
  });

  console.log(`${result.pass ? "ĐẠT " : "FAIL"} ${item.id} [${item.kind}] ${ms}ms` +
    (result.pass ? "" : ` — ${result.reasons.join("; ")}`));
  // Nhường nhịp cho free tier, tránh 429 hàng loạt.
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

const passed = rows.filter((row) => row.pass).length;
const byKind = {};
for (const row of rows) {
  byKind[row.kind] ??= { total: 0, pass: 0 };
  byKind[row.kind].total += 1;
  if (row.pass) byKind[row.kind].pass += 1;
}

await writeFile(
  path.join(HERE, "runs", `${stamp}.jsonl`),
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
  "utf8",
);

const md = [
  `# Kết quả eval — ${stamp}`,
  "",
  `**Tổng: ${passed}/${rows.length} câu đạt** (${Math.round((passed / rows.length) * 100)}%)`,
  "",
  `Endpoint: \`${BASE}\` · model: ${rows.find((r) => r.model)?.model ?? "?"}`,
  "",
  "## Theo kiểu tình huống",
  "",
  "| Kiểu | Đạt | Tổng |",
  "|---|---:|---:|",
  ...Object.entries(byKind).map(([kind, s]) => `| ${kind} | ${s.pass} | ${s.total} |`),
  "",
  "## Từng câu",
  "",
  "| ID | Kiểu | Kết quả | Trạng thái | Conf | Lý do fail |",
  "|---|---|---|---|---:|---|",
  ...rows.map((row) =>
    `| ${row.id} | ${row.kind} | ${row.pass ? "ĐẠT" : "**FAIL**"} | ${row.actual_status} | ` +
    `${row.confidence?.toFixed(2) ?? "-"} | ${row.reasons.join("; ") || "-"} |`),
  "",
  "## Câu fail — chi tiết",
  "",
  ...rows.filter((row) => !row.pass).flatMap((row) => [
    `### ${row.id} — ${row.question}`,
    "",
    `Lý do: ${row.reasons.join("; ")}`,
    "",
    "```",
    row.answer.slice(0, 600) || "(không có câu trả lời)",
    "```",
    "",
  ]),
].join("\n");

await writeFile(path.join(HERE, "runs", `${stamp}.md`), md, "utf8");

console.log(`\n=== ${passed}/${rows.length} câu đạt ===`);
console.log(`Chi tiết: eval/runs/${stamp}.md`);
