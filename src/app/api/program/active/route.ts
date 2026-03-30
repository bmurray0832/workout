import { NextResponse } from "next/server";
import { getActiveProgram } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const program = await getActiveProgram();
  if (!program) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(program);
}
