#!/usr/bin/env node
/**
 * Kiểm tra GEMINI_API_KEY dùng được và liệt kê model khả dụng.
 *
 *   node --env-file=.env.local scripts/check-gemini.mjs
 *
 * Không in API key ra màn hình, chỉ in kết quả gọi API.
 */
const key = process.env.GEMINI_API_KEY;

if (!key) {
  console.error("Thiếu GEMINI_API_KEY. Copy .env.example sang .env.local rồi điền key.");
  process.exit(1);
}

const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
  { headers: { "x-goog-api-key": key } },
);

if (!response.ok) {
  console.error(`Gọi API thất bại: HTTP ${response.status}`);
  console.error((await response.text()).slice(0, 400));
  process.exit(1);
}

const { models } = await response.json();
const usable = models
  .filter((model) => (model.supportedGenerationMethods ?? []).includes("generateContent"))
  .map((model) => model.name.replace("models/", ""));

// Bỏ các biến thể chuyên biệt (tts/image/audio/live) — tutor chỉ cần model text.
const candidates = usable.filter(
  (name) => /^gemini-(2\.5|3)/.test(name) && !/tts|image|audio|native|live|robotics/.test(name),
);

console.log(`Key hợp lệ. ${usable.length} model hỗ trợ generateContent.`);
console.log("\nỨng viên cho cascade:");
for (const name of candidates.sort()) console.log(`  ${name}`);
