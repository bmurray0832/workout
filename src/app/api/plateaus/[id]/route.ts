import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { resolved, resolvedNotes } = await req.json();
  const plateau = await db.plateauLog.update({
    where: { id: parseInt(params.id) },
    data: { resolved, resolvedNotes: resolvedNotes ?? null, resolvedAt: resolved ? new Date() : null },
  });
  return NextResponse.json(plateau);
}
