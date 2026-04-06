import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUserProfile } from "@/lib/db";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { phase, notes } = await req.json();
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 400 });

  const prompt = `You are a sports nutritionist calculating precise calorie and macro targets for a natural strength athlete.\n\nATHLETE STATS:\n- Weight: ${profile.weightLbs}lbs (${(profile.weightLbs / 2.205).toFixed(1)}kg)\n- Height: ${profile.heightStr}\n- Age: ${profile.age}\n- Sex: ${profile.sex}\n- Training: ${profile.trainingDaysPerWeek} days/week, ${profile.sessionLengthMin} min sessions\n- Current phase: ${phase}\n- Injury: ${profile.injuryNotes ?? "none"}\n${notes ? `- Dietary notes: ${notes}` : ""}\n\nTASK:\n1. Calculate TDEE using Mifflin-St Jeor with appropriate activity multiplier for ${profile.trainingDaysPerWeek} training days/week.\n2. Apply correct calorie adjustment for "${phase}" phase: bulk +200-300 kcal, cut -300-500 kcal, maintain at TDEE, recomp -100-200 kcal.\n3. Set protein at 0.9-1.1g per lb bodyweight.\n4. Set fat at 25-30% of total calories.\n5. Fill remaining with carbs.\n\nWrite a concise 3-4 sentence rationale, then output ONLY this JSON at the very end:\n\n{"dailyCalorieTarget": <number>, "proteinTargetG": <number>, "carbTargetG": <number>, "fatTargetG": <number>, "mealsPerDay": 4}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({ model: "claude-sonnet-4-6", max_tokens: 512, messages: [{ role: "user", content: prompt }] });
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") controller.enqueue(encoder.encode(chunk.delta.text));
        }
        controller.close();
      } catch (err) { console.error(err); controller.error(err); }
    },
  });

  return new NextResponse(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
