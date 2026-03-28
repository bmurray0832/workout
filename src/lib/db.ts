import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

const STALL_WEEKS = 3;

export async function detectPlateaus(): Promise<
  { exerciseName: string; stalledWeeks: number; lastWeight: number }[]
> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALL_WEEKS * 7);

  const logs = await db.exerciseLog.findMany({
    where: {
      session: {
        date: { gte: cutoff },
        completed: true,
      },
    },
    include: { session: true },
    orderBy: { createdAt: "asc" },
  });

  const byExercise: Record<string, { date: Date; weightLbs: number }[]> = {};

  for (const log of logs) {
    if (!byExercise[log.exerciseName]) byExercise[log.exerciseName] = [];
    byExercise[log.exerciseName].push({
      date: log.session.date,
      weightLbs: log.weightLbs,
    });
  }

  const plateaus: { exerciseName: string; stalledWeeks: number; lastWeight: number }[] = [];

  for (const [name, entries] of Object.entries(byExercise)) {
    if (entries.length < 3) continue;

    const weeklyMax: Record<string, number> = {};
    for (const entry of entries) {
      const weekKey = getWeekKey(entry.date);
      weeklyMax[weekKey] = Math.max(weeklyMax[weekKey] ?? 0, entry.weightLbs);
    }

    const weeks = Object.keys(weeklyMax).sort();
    if (weeks.length < STALL_WEEKS) continue;

    const recentWeeks = weeks.slice(-STALL_WEEKS);
    const recentWeights = recentWeeks.map((w) => weeklyMax[w]);
    const maxRecent = Math.max(...recentWeights);
    const minRecent = Math.min(...recentWeights);

    if (maxRecent - minRecent < 2.5) {
      plateaus.push({
        exerciseName: name,
        stalledWeeks: STALL_WEEKS,
        lastWeight: recentWeights[recentWeights.length - 1],
      });
    }
  }

  return plateaus;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

export async function getUserProfile() {
  return db.userProfile.findUnique({ where: { id: 1 } });
}

export async function getActiveProgram() {
  return db.program.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}
