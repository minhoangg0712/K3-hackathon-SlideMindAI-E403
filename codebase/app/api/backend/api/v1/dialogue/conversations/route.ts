import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

/**
 * Tạo phiên hội thoại Tutor. Bản gốc trả { conversation_id } và client cache
 * nó ở sessionStorage.
 */
export async function POST(request: Request) {
  let body: { day_code?: string; mode?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* body rỗng vẫn hợp lệ */
  }

  return NextResponse.json({
    conversation_id: `conv_${randomUUID()}`,
    day_code: body.day_code ?? null,
    mode: body.mode ?? "in_class",
  });
}
