import { NextResponse } from "next/server";
import { NOTIFICATIONS } from "@/data/fixtures";

export async function GET() {
  return NextResponse.json(NOTIFICATIONS);
}
