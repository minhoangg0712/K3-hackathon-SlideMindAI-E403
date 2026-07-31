import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createConversation, listConversations } from "@/lib/conversation-store";

/**
 * Tạo phiên hội thoại Tutor. Bản gốc chỉ trả một uuid rồi quên ngay — client
 * tự cache ở sessionStorage. Ở đây phiên được ghi lại phía server nên đọc lại
 * được sau khi F5.
 */
export async function POST(request: Request) {
  let body: { day_code?: string; mode?: string; course_id?: string; material_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* body rỗng vẫn hợp lệ */
  }

  const conversationId = `conv_${randomUUID()}`;
  createConversation(conversationId, {
    course_id: body.course_id,
    material_id: body.material_id,
    day_code: body.day_code ?? null,
  });

  return NextResponse.json({
    conversation_id: conversationId,
    day_code: body.day_code ?? null,
    mode: body.mode ?? "in_class",
  });
}

/** Danh sách phiên đã lưu — nguồn dữ liệu cho nút History trên panel Tutor. */
export async function GET(request: Request) {
  const materialId = new URL(request.url).searchParams.get("material_id") ?? undefined;
  const items = listConversations(materialId).map((item) => ({
    conversation_id: item.conversation_id,
    course_id: item.course_id ?? null,
    material_id: item.material_id ?? null,
    created_at: item.created_at,
    message_count: item.messages.length,
    // Câu hỏi đầu tiên làm tiêu đề, giống cách mọi trình chat đặt tên phiên.
    title: item.messages.find((message) => message.role === "user")?.content.slice(0, 80) ?? null,
  }));

  return NextResponse.json({ items });
}
