#!/usr/bin/env node
/**
 * Trích 8 đoạn code chứng minh điểm yếu của AI Assistant VLearn bản gốc,
 * trực tiếp từ bundle production đã lưu trong `evidence/vlearn-bundle/`.
 *
 *   node evidence/verify.mjs          in toàn bộ
 *   node evidence/verify.mjs 7        chỉ in điểm 7
 *
 * Mục đích: bất kỳ ai (kể cả ban giám khảo) chạy được lệnh này và tự thấy
 * đoạn code, không phải tin vào slide. Script chỉ đọc file và cắt chuỗi —
 * không sửa gì, không gọi mạng.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHUNK = join(HERE, "vlearn-bundle", "js", "5615.e2b0eefb29fafcbe.js");

/**
 * Mỗi mục neo vào một chuỗi có thật trong bundle rồi cắt cửa sổ quanh nó.
 * Dùng indexOf thay cho regex vì bundle có newline thật bên trong template
 * literal — `grep -o` bị chặn ở đó, còn cắt theo index thì không.
 */
const EVIDENCE = [
  {
    id: 1,
    title: "Confidence là số giả",
    anchor: "confidence:n.length?",
    before: 60,
    after: 150,
    verdict:
      'Badge "60% · Trung bình" trên UI chỉ có nghĩa "không tìm được citation".\n' +
      "Không có tín hiệu nào đo độ đúng của chính câu trả lời.",
  },
  {
    id: 2,
    title: "Citation parse bằng regex trên prose",
    anchor: "/\\[trang (\\d+)\\]",
    before: 40,
    after: 230,
    verdict:
      "Regex chạy trên text model tự viết, không đối chiếu với slide.\n" +
      "document_title để rỗng, section luôn null, quote cắt cứng 300 ký tự.",
  },
  {
    id: 3,
    title: "Ngữ cảnh gửi lên cực mỏng",
    anchor: "tools:[],context:[]",
    before: 190,
    after: 90,
    verdict:
      "Hai trường mang ngữ cảnh của giao thức AG-UI đều rỗng cứng.\n" +
      "Toàn bộ ngữ cảnh bị nén vào một chuỗi text duy nhất.",
  },
  {
    id: 4,
    title: "memory_used / cache_hit hardcode",
    anchor: "memory_used:!1,cache_hit:!1",
    before: 175,
    after: 30,
    verdict:
      "!1 là false sau khi minify. Không có memory xuyên phiên, không có cache —\n" +
      "hai trường này chưa bao giờ mang giá trị nào khác.",
  },
  {
    id: 5,
    title: "Quota đếm ở client",
    anchor: "vlearn_quota_",
    before: 95,
    after: 250,
    verdict:
      "maxLimit 15 nằm trong JavaScript chạy trên máy người dùng.\n" +
      "Mở DevTools xoá localStorage là quota về 0.",
  },
  {
    id: 6,
    title: "Hội thoại ở sessionStorage",
    anchor: '"edupulse_chat_conversation"',
    before: 30,
    after: 210,
    verdict: "sessionStorage bị xoá khi đóng tab — đóng tab là mất hội thoại.",
  },
  {
    id: 7,
    title: "Chỉ một tool search_slides",
    anchor: '"search_slides"===r.toolCallName',
    before: 120,
    after: 120,
    verdict:
      '"search_slides" là tên tool duy nhất trong toàn bộ bundle, và nó chỉ tìm\n' +
      "trong tài liệu của day đang mở. Kiến thức nền của chính slide đó nằm ở\n" +
      'day khác thì tutor trả lời "trong tài liệu của bài học này không đề cập".',
  },
  {
    id: 8,
    title: "Câu hỏi bị cắt câm ở 2000 ký tự",
    anchor: "let r=((e.selected_text",
    before: 0,
    after: 330,
    verdict:
      "Prefix (Trang N) ghép vào ĐẦU chuỗi rồi mới slice(0,2e3) — nên phần bị\n" +
      "cắt là ĐUÔI câu hỏi người dùng. Ô input không có maxLength, không counter,\n" +
      "không cảnh báo: gõ 2500 chữ thì mất 500 chữ cuối mà không hề biết.",
  },
];

/** Dead code đáng nói, nhưng phải nói cho đúng — xem phần in ra ở cuối. */
const DEMO_FLAG = "76503:(e,t,a)=>{a.d(t,{A:()=>r});function r(){return!1}}";

function extract(source, { anchor, before, after }) {
  const at = source.indexOf(anchor);
  if (at === -1) return null;
  return source.slice(Math.max(0, at - before), at + anchor.length + after);
}

function wrap(text, width = 96) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let rest = paragraph;
    while (rest.length > width) {
      lines.push(rest.slice(0, width));
      rest = rest.slice(width);
    }
    lines.push(rest);
  }
  return lines.join("\n");
}

const source = await readFile(CHUNK, "utf8");
const only = process.argv[2] ? Number(process.argv[2]) : null;
const wanted = only ? EVIDENCE.filter((item) => item.id === only) : EVIDENCE;

if (wanted.length === 0) {
  console.error(`Không có điểm số ${only}. Hợp lệ: 1-8.`);
  process.exit(1);
}

console.log(`Nguồn: ${CHUNK}`);
console.log(`Kích thước: ${source.length.toLocaleString("vi-VN")} ký tự\n`);

let missing = 0;
for (const item of wanted) {
  const snippet = extract(source, item);
  console.log("─".repeat(100));
  console.log(`${item.id}. ${item.title.toUpperCase()}`);
  console.log("─".repeat(100));
  if (snippet === null) {
    missing += 1;
    console.log(`  !! Không tìm thấy neo "${item.anchor}" — bundle đã đổi?\n`);
    continue;
  }
  console.log(wrap(snippet));
  console.log(`\n→ ${item.verdict}\n`);
}

if (!only) {
  console.log("─".repeat(100));
  console.log("PHỤ LỤC — chế độ demo scripted (đọc kỹ trước khi dùng để pitch)");
  console.log("─".repeat(100));
  const flagAt = source.indexOf(DEMO_FLAG);
  console.log(
    flagAt === -1
      ? "Không tìm thấy module cờ demo."
      : `Cờ điều khiển (module webpack 76503):\n${DEMO_FLAG}`,
  );
  console.log(
    "\n→ Bundle production còn nguyên 4 câu trả lời tiếng Việt viết sẵn cho\n" +
      '  "gradient descent" / "learning rate" / "tối ưu", kèm flashcard, mindmap,\n' +
      "  algorithm_simulator và hiệu ứng gõ chữ giả bằng setInterval(...,20).\n" +
      "\n" +
      "  NHƯNG nó là dead code: chỉ chạy trong nhánh catch/onError, và cờ trên\n" +
      "  trả về false cứng. Người dùng thật không bao giờ thấy nó.\n" +
      "\n" +
      "  Cách nói đúng: chế độ demo scripted đã tắt trong production, nhưng code\n" +
      "  vẫn nằm trong bundle gửi tới trình duyệt mọi người học — bật lại chỉ cần\n" +
      "  đổi một ký tự. KHÔNG nói 'AI của họ là giả' — sai, và mất uy tín của\n" +
      "  cả 8 điểm ở trên.\n",
  );
}

if (missing > 0) {
  console.error(`${missing} mục không trích được.`);
  process.exit(1);
}
