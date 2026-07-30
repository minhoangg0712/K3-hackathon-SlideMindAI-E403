import { NextResponse } from "next/server";
import { COURSES } from "@/data/fixtures";

export async function GET() {
  return NextResponse.json({ items: COURSES });
}
