import { NextResponse } from "next/server";
import { CURRICULUM } from "@/data/fixtures";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  if (courseId.toUpperCase() !== CURRICULUM.course_id) {
    return NextResponse.json({ detail: "Course not found" }, { status: 404 });
  }
  return NextResponse.json(CURRICULUM);
}
