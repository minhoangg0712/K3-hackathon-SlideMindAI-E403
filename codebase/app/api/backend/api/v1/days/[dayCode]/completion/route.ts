import { NextResponse } from "next/server";
import { dayCompletion } from "@/data/fixtures";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dayCode: string }> },
) {
  const { dayCode } = await params;
  return NextResponse.json(dayCompletion(dayCode));
}
