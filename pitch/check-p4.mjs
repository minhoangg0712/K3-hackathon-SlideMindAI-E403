#!/usr/bin/env node
/**
 * Kiểm chứng prompt P4 trong pitch/prompts.md thật sự bị VLearn cắt mất câu
 * hỏi ở cuối. Chạy trước ngày pitch — nếu prompt ngắn đi (ai đó sửa lại) thì
 * demo sẽ hỏng vì câu hỏi vẫn còn nguyên sau khi cắt.
 *
 * Mô phỏng đúng dòng code của bản gốc:
 *   ((`(Trang ${page})\n`) + user_question).slice(0, 2e3)
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIMIT = 2000;

const source = await readFile(path.join(HERE, "prompts.md"), "utf8");
const match = source.match(/^Tôi đang làm bài tập cuối khoá[\s\S]*?vì sao\?$/m);

if (!match) {
  console.error("Không tìm thấy prompt P4 trong prompts.md — có ai sửa đổi đoạn mở đầu?");
  process.exit(1);
}

const question = match[0];
const sent = `(Trang 22)\n${question}`;
const afterCut = sent.slice(0, LIMIT);
const lost = sent.slice(LIMIT);

const MARKER = "câu hỏi cuối cùng";
const stillThere = afterCut.includes(MARKER);

console.log(`P4:            ${question.length} ký tự`);
console.log(`+ prefix:      ${sent.length}`);
console.log(`bị cắt mất:    ${lost.length} ký tự`);
console.log(`mất từ đoạn:   ${JSON.stringify(lost.slice(0, 70))}`);
console.log();

if (stillThere) {
  console.error("HỎNG: câu hỏi thật vẫn còn sau khi cắt — demo sẽ không chứng minh được gì.");
  console.error(`Cần viết dài thêm ít nhất ${LIMIT - sent.indexOf(MARKER) + 60} ký tự vào phần bối cảnh.`);
  process.exit(1);
}

console.log("ĐẠT: câu hỏi thật đã bị cắt mất. Demo ③ dùng được.");
