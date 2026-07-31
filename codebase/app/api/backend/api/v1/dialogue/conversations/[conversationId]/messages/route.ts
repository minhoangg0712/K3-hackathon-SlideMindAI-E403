import { NextResponse } from "next/server";
import { getConversation } from "@/lib/conversation-store";

/**
 * Đọc lại toàn bộ hội thoại đã lưu ở server.
 *
 * Bản gốc không có endpoint này — hội thoại nằm trong `sessionStorage`, F5 hay
 * đóng tab là mất, và nút History trên panel Tutor không nối vào đâu cả.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const record = getConversation(conversationId);

  if (!record) {
    // Hội thoại chưa có lượt nào vẫn là hợp lệ, chỉ là rỗng.
    return NextResponse.json({ conversation_id: conversationId, items: [] });
  }

  return NextResponse.json({
    conversation_id: record.conversation_id,
    course_id: record.course_id ?? null,
    material_id: record.material_id ?? null,
    created_at: record.created_at,
    items: record.messages,
  });
}
