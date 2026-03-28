import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const exercises = await db.exerciseLog.findMany({
    where: { sessionId: parseInt(params.id) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { exerciseName, muscleGroup, sets, reps, weightLbs, rpe, tempo, notes } = await req.json();
  const exercise = await db.exerciseLog.create({
    data: {
      sessionId: parseInt(params.id),
      exerciseName,
      muscleGroup: muscleGroup ?? null,
      sets: sets ?? 1,
      reps,
      weightLbs,
      rpe: rpe ?? null,
      tempo: tempo ?? null,
      notes: notes ?? null,
    },
  });
  return NextResponse.json(exercise, { status: 201 });
}
