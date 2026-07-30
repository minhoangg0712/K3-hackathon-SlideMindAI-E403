import { NextResponse } from "next/server";

/** Thumbs up/down cho một câu trả lời của Tutor. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await params;
  let body: { rating?: string; reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* không có body vẫn chấp nhận */
  }

  // Bản dựng lại chỉ ghi nhận, chưa có store phía sau.
  console.log(`[tutor-feedback] ${messageId} rating=${body.rating ?? "?"}`);
  return NextResponse.json({ message_id: messageId, recorded: true });
}
