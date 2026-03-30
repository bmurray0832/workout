import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, getUserProfile, getActiveProgram } from "@/lib/db";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET() {
  const [profile, program, recentSessions, lastCheckIn, plateaus] = await Promise.all([
    getUserProfile(),
    getActiveProgram(),
    db.workoutSession.findMany({ take: 3, where: { completed: true }, orderBy: { date: "desc" }, include: { exercises: { select: { exerciseName: true, weightLbs: true, reps: true, sets: true } } } }),
    db.weeklyCheckIn.findFirst({ orderBy: { date: "desc" } }),
    db.plateauLog.findMany({ where: { resolved: false } }),
  ]);

  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 400 });

  let programContext = "No active program.";
  if (program?.startDate) {
    const days = Math.floor((Date.now() - new Date(program.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const programWeek = Math.max(1, Math.ceil(days / 7));
    programContext = `Active program: ${program.name}, currently in Week ${programWeek} of ${program.weeks}.`;
  }

  const sessionSummary = recentSessions.length > 0
    ? recentSessions.map((s) => {
        const topLifts = s.exercises.slice(0, 3).map((e) => `${e.exerciseName} ${e.weightLbs}lbs`).join(", ");
        const daysAgo = Math.floor((Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24));
        return `- ${s.sessionName} (${daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo}d ago`}): ${topLifts}`;
      }).join("\n")
    : "No sessions logged yet.";

  const checkInSummary = lastCheckIn
    ? `Last check-in (${Math.floor((Date.now() - new Date(lastCheckIn.date).getTime()) / 86400000)}d ago): ${lastCheckIn.bodyweightLbs}lbs, sleep ${lastCheckIn.sleepHours}h (quality ${lastCheckIn.sleepQuality}/10), energy ${lastCheckIn.energyScore}/10, recovery ${lastCheckIn.recoveryScore}/10, stress ${lastCheckIn.stressLevel}.${lastCheckIn.struggles ? ` Struggles: ${lastCheckIn.struggles}.` : ""}`
    : "No check-ins logged yet.";

  const nutritionSummary = profile.dailyCalorieTarget
    ? `Nutrition targets: ${profile.dailyCalorieTarget} kcal/day · ${profile.proteinTargetG}g protein · ${profile.carbTargetG}g carbs · ${profile.fatTargetG}g fat (${profile.nutritionPhase} phase).`
    : "No nutrition targets set.";

  const plateauSummary = plateaus.length > 0
    ? `Active plateaus: ${plateaus.map((p) => `${p.exerciseName} stuck at ${p.lastWeight}lbs for ${p.stalledWeeks}+ weeks`).join(", ")}.`
    : "No plateaus detected.";

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const prompt = `You are a concise, data-driven personal training coach. Give a sharp, practical daily briefing. No fluff. Be direct and specific.

TODAY: ${today}
ATHLETE: ${profile.name}, ${profile.weightLbs}lbs, ${profile.age}yo, goal: ${profile.primaryGoal}
INJURY: ${profile.injuryNotes ?? "none"}

PROGRAM: ${programContext}
RECENT SESSIONS:
${sessionSummary}

CHECK-IN: ${checkInSummary}
NUTRITION: ${nutritionSummary}
PLATEAUS: ${plateauSummary}

Write a briefing in exactly these 4 sections. Keep each section to 2-3 sentences max. Be specific — use their actual numbers.

**Today's Outlook**
[What kind of training day should today be? Rest, train hard, or moderate? Which session is next?]

**Recovery Read**
[Honest assessment of recovery state based on sleep, stress, and energy. Any red flags?]

**Nutrition Today**
[One specific, actionable nutrition focus with a number.]

**Goal Pulse**
[Brief progress update. One thing to focus on this week.]`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({ model: "claude-sonnet-4-6", max_tokens: 400, messages: [{ role: "user", content: prompt }] });
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") controller.enqueue(encoder.encode(chunk.delta.text));
        }
        controller.close();
      } catch (err) { console.error(err); controller.error(err); }
    },
  });

  return new NextResponse(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
