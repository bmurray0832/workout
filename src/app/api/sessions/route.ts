import { NextRequest, NextResponse } from "next/server";
import { db, getActiveProgram } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const sessions = await db.workoutSession.findMany({
    take: limit,
    orderBy: { date: "desc" },
    include: { exercises: true, program: { select: { name: true } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const { sessionName, date, week, day } = await req.json();
  const program = await getActiveProgram();
  const session = await db.workoutSession.create({
    data: {
      sessionName: sessionName ?? "Session",
      date: date ? new Date(date) : new Date(),
      week: week ?? null,
      day: day ?? null,
      programId: program?.id ?? null,
    },
  });
  return NextResponse.json(session, { status: 201 });
}
