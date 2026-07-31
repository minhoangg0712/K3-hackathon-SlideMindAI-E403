#!/usr/bin/env node
/**
 * Đặt lại bộ đếm quota Tutor (mặc định 15 câu/ngày).
 *
 *   node scripts/reset-quota.mjs                       # reset mọi tài khoản
 *   node scripts/reset-quota.mjs 23001525@hus.edu.vn   # chỉ một tài khoản
 *
 * Vì sao script không tự xoá được: quota nằm ở `localStorage` của trình duyệt,
 * đúng như bản gốc vlearn.dev — và localStorage chỉ trình duyệt chạm tới được,
 * không process Node nào đọc hay ghi vào đó. Script sinh sẵn đoạn lệnh và chép
 * luôn vào clipboard; việc còn lại là dán một lần vào Console (F12).
 *
 * Muốn khỏi phải reset: đặt NEXT_PUBLIC_TUTOR_DAILY_LIMIT=0 trong .env.local
 * rồi khởi động lại dev server — hạn mức tắt hẳn, thanh quota hiện "không giới
 * hạn". Đó là cách nên dùng khi demo hoặc chạy eval.
 */
import { spawn } from "node:child_process";
import { platform } from "node:os";

const email = process.argv[2];
const today = new Date().toISOString().split("T")[0];

// Đúng công thức key của lib/tutor-client.ts: vlearn_quota_<email>_<YYYY-MM-DD>
const prefix = email ? `vlearn_quota_${email.toLowerCase()}_` : "vlearn_quota_";

const snippet =
  `Object.keys(localStorage).filter(k=>k.startsWith(${JSON.stringify(prefix)}))` +
  `.forEach(k=>localStorage.removeItem(k));location.reload()`;

/** Chép vào clipboard bằng công cụ sẵn có của hệ điều hành. */
function copyToClipboard(text) {
  const command =
    platform() === "win32" ? "clip" : platform() === "darwin" ? "pbcopy" : "xclip";
  const args = platform() === "linux" ? ["-selection", "clipboard"] : [];

  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
    child.stdin.end(text);
  });
}

const copied = await copyToClipboard(snippet);

console.log();
console.log(email ? `Reset quota cho ${email} (ngày ${today}):` : `Reset quota mọi tài khoản:`);
console.log();
console.log(snippet);
console.log();
console.log(
  copied
    ? "Đã chép vào clipboard. Mở tab đang chạy app > F12 > Console > Ctrl+V > Enter."
    : "Không chép được vào clipboard, copy tay đoạn trên rồi dán vào Console (F12).",
);
console.log();
console.log("Muốn tắt hẳn hạn mức: NEXT_PUBLIC_TUTOR_DAILY_LIMIT=0 trong .env.local.");
