import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await db.workoutSession.findUnique({
    where: { id: parseInt(params.id) },
    include: { exercises: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const session = await db.workoutSession.update({
    where: { id: parseInt(params.id) },
    data: { completed: data.completed, notes: data.notes, durationMin: data.durationMin },
  });
  return NextResponse.json(session);
}
