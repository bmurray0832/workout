import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const plateaus = await db.plateauLog.findMany({ where: { resolved: false }, orderBy: { detectedAt: "desc" } });
  return NextResponse.json(plateaus);
}
