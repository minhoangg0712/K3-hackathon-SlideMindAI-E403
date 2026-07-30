#!/usr/bin/env node
/** Gọi thử Gemini streaming để xác minh SDK + model + key trước khi cắm vào route. */
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.argv[2] ?? "gemini-2.5-flash";

try {
  const stream = await client.models.generateContentStream({
    model,
    contents: [{ role: "user", parts: [{ text: "Trả lời đúng hai chữ: xin chào" }] }],
    config: { systemInstruction: "Bạn trả lời cực ngắn.", temperature: 0, maxOutputTokens: 64 },
  });
  let text = "";
  let usage;
  for await (const chunk of stream) {
    if (chunk.text) text += chunk.text;
    if (chunk.usageMetadata) usage = chunk.usageMetadata;
  }
  console.log(`model ${model} OK`);
  console.log("text:", JSON.stringify(text));
  console.log("usage:", JSON.stringify(usage));
} catch (cause) {
  console.error(`model ${model} LỖI:`);
  console.error(String(cause).slice(0, 900));
  process.exit(1);
}
