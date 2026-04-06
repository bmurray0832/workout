import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, string>).gte = from;
    if (to) (where.date as Record<string, string>).lte = to;
  }

  const logs = await db.dailyLog.findMany({
    where,
    take: limit,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const dateStr =
    data.date ?? new Date().toISOString().split("T")[0];

  const log = await db.dailyLog.upsert({
    where: { date: dateStr },
    create: {
      date: dateStr,
      weightLbs: data.weightLbs ?? null,
      sleepHours: data.sleepHours ?? null,
      waterOz: data.waterOz ?? null,
      mood: data.mood ?? null,
      energy: data.energy ?? null,
      steps: data.steps ?? null,
      notes: data.notes ?? null,
    },
    update: {
      weightLbs: data.weightLbs ?? null,
      sleepHours: data.sleepHours ?? null,
      waterOz: data.waterOz ?? null,
      mood: data.mood ?? null,
      energy: data.energy ?? null,
      steps: data.steps ?? null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(log, { status: 200 });
}
