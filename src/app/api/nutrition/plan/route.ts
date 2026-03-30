import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, getUserProfile } from "@/lib/db";
import { buildMealPlanPrompt } from "@/lib/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractSection(content: string, header: string): string | null {
  const regex = new RegExp(`## ${header}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

export async function POST(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "No profile found. Complete onboarding first." }, { status: 400 });
  if (!profile.nutritionCalculated) return NextResponse.json({ error: "Calculate your nutrition targets first." }, { status: 400 });

  const activeProgram = await db.program.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, content: true },
  });

  const prompt = buildMealPlanPrompt(profile, activeProgram);

  const encoder = new TextEncoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            fullContent += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        await db.aIResponse.create({
          data: {
            promptType: "mealplan",
            inputData: JSON.stringify({ phase: profile.nutritionPhase, programId: activeProgram?.id }),
            content: fullContent,
            model: "claude-sonnet-4-6",
          },
        });

        await db.nutritionPlan.updateMany({ where: { isActive: true }, data: { isActive: false } });

        await db.nutritionPlan.create({
          data: {
            programId: activeProgram?.id ?? null,
            phase: profile.nutritionPhase ?? "cut",
            dailyCalories: profile.dailyCalorieTarget ?? 0,
            proteinG: profile.proteinTargetG ?? 0,
            carbsG: profile.carbTargetG ?? 0,
            fatG: profile.fatTargetG ?? 0,
            mealPlan: extractSection(fullContent, "7-DAY MEAL PLAN") ?? fullContent,
            snackSwaps: extractSection(fullContent, "SNACK SWAPS"),
            personalRules: extractSection(fullContent, "PERSONAL RULES"),
            timeline: extractSection(fullContent, "TIMELINE"),
            hydration: extractSection(fullContent, "HYDRATION"),
            supplements: extractSection(fullContent, "SUPPLEMENTS"),
            isActive: true,
          },
        });

        controller.close();
      } catch (err) {
        console.error("Meal plan stream error:", err);
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Prompt-Type": "mealplan",
    },
  });
}
