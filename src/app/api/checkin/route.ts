import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "8");
  const checkIns = await db.weeklyCheckIn.findMany({ take: limit, orderBy: { date: "desc" } });
  return NextResponse.json(checkIns);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const program = await db.program.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  let weekNumber: number | null = null;
  if (program?.startDate) {
    const daysSinceStart = Math.floor((Date.now() - new Date(program.startDate).getTime()) / (1000 * 60 * 60 * 24));
    weekNumber = Math.max(1, Math.ceil(daysSinceStart / 7));
  }
  const checkIn = await db.weeklyCheckIn.create({
    data: {
      date: data.date ? new Date(data.date) : new Date(),
      weekNumber,
      bodyweightLbs: data.bodyweightLbs,
      photoTaken: data.photoTaken ?? false,
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality,
      stressLevel: data.stressLevel,
      energyScore: data.energyScore,
      recoveryScore: data.recoveryScore,
      avgCalories: data.avgCalories ?? null,
      avgProteinG: data.avgProteinG ?? null,
      nutritionNotes: data.nutritionNotes ?? null,
      wins: data.wins ?? null,
      struggles: data.struggles ?? null,
      notes: data.notes ?? null,
    },
  });
  const { detectPlateaus } = await import("@/lib/db");
  const plateaus = await detectPlateaus();
  for (const plateau of plateaus) {
    const existing = await db.plateauLog.findFirst({ where: { exerciseName: plateau.exerciseName, resolved: false } });
    if (!existing) await db.plateauLog.create({ data: { exerciseName: plateau.exerciseName, stalledWeeks: plateau.stalledWeeks, lastWeight: plateau.lastWeight } });
  }
  return NextResponse.json({ checkIn, plateausDetected: plateaus.length }, { status: 201 });
}
