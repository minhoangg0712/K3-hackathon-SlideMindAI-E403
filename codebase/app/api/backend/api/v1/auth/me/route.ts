import { NextResponse } from "next/server";
import { CURRENT_USER } from "@/data/fixtures";

export async function GET() {
  return NextResponse.json(CURRENT_USER);
}
