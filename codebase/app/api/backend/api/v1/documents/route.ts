import { NextResponse } from "next/server";
import { DOCUMENTS } from "@/data/fixtures";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("course_id");
  const lectureId = url.searchParams.get("lecture_id");

  let items = DOCUMENTS;
  if (courseId) {
    items = items.filter((doc) => doc.course_id.toUpperCase() === courseId.toUpperCase());
  }
  if (lectureId) {
    items = items.filter((doc) => doc.lecture_id === lectureId);
  }
  return NextResponse.json({ items });
}
