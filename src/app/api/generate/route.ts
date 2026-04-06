import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, getUserProfile } from "@/lib/db";
import { buildProgramPrompt, buildPlateauPrompt, buildWeakPointPrompt, buildRecoveryPrompt, buildInjuryPreventionPrompt, buildTrackerPrompt, buildRecompPrompt, buildMacroGuidePrompt } from "@/lib/prompts";

export type PromptType = "program" | "plateau" | "weakpoint" | "recovery" | "injury" | "tracker" | "recomp" | "macroguide";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to your Railway environment variables." },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { type, options = {} } = (await req.json()) as { type: PromptType; options?: Record<string, unknown> };
  const profile = await getUserProfile();
  if (!profile) return NextResponse.json({ error: "No profile found. Complete onboarding first." }, { status: 400 });

  let prompt = "";
  switch (type) {
    case "program":
      prompt = buildProgramPrompt(profile);
      break;
    case "plateau": {
      const [unresolvedPlateaus, activeProgram, recentCheckIn] = await Promise.all([
        db.plateauLog.findMany({ where: { resolved: false }, orderBy: { detectedAt: "desc" } }),
        db.program.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" }, select: { name: true, content: true } }),
        db.weeklyCheckIn.findFirst({ orderBy: { date: "desc" } }),
      ]);
      const plateauData = unresolvedPlateaus.map((p) => ({ exerciseName: p.exerciseName, stalledWeeks: p.stalledWeeks, lastWeight: p.lastWeight }));
      const plateaus = plateauData.length > 0 ? plateauData : ((options.plateaus as Parameters<typeof buildPlateauPrompt>[1]) ?? []);
      const programSummary = activeProgram ? `${activeProgram.name}\n\n${activeProgram.content.slice(0, 1500)}...` : (options.currentProgram as string | undefined);
      prompt = buildPlateauPrompt(profile, plateaus, programSummary, recentCheckIn);
      if (unresolvedPlateaus.length > 0) await db.plateauLog.updateMany({ where: { resolved: false }, data: { aiAnalysis: "Generating..." } });
      break;
    }
    case "weakpoint": {
      const aesthetic = (options.aestheticWeakPoints as string) ?? "";
      const performance = (options.performanceWeakPoints as string) ?? "";
      const activeProgram = await db.program.findFirst({ where: { isActive: true }, select: { name: true, content: true } });
      const programSummary = activeProgram ? `${activeProgram.name}\n\n${activeProgram.content.slice(0, 1500)}...` : (options.currentProgram as string | undefined);
      prompt = buildWeakPointPrompt(profile, aesthetic, performance, programSummary);
      break;
    }
    case "recovery":
      prompt = buildRecoveryPrompt(profile);
      break;
    case "injury":
      prompt = buildInjuryPreventionPrompt(profile);
      break;
    case "tracker": {
      const checkIns = await db.weeklyCheckIn.findMany({ take: 8, orderBy: { date: "desc" } });
      const activeProgram = await db.program.findFirst({ where: { isActive: true }, select: { name: true } });
      prompt = buildTrackerPrompt(profile, checkIns, activeProgram?.name);
      break;
    }
    case "recomp":
      prompt = buildRecompPrompt(profile, options.bodyFatPercent as number | undefined);
      break;
    case "macroguide": {
      const recentCheckIns = await db.weeklyCheckIn.findMany({ take: 8, orderBy: { date: "desc" } });
      prompt = buildMacroGuidePrompt(profile, recentCheckIns);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown prompt type" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({ model: "claude-sonnet-4-6", max_tokens: 8192, messages: [{ role: "user", content: prompt }] });
        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            fullContent += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        await db.aIResponse.create({ data: { promptType: type, inputData: JSON.stringify({ type, options }), content: fullContent, model: "claude-sonnet-4-6" } });
        if (type === "plateau") await db.plateauLog.updateMany({ where: { resolved: false }, data: { aiAnalysis: fullContent } });
        if (type === "program" || type === "recomp") {
          await db.program.updateMany({ where: { isActive: true }, data: { isActive: false } });
          await db.program.create({ data: { name: type === "program" ? "12-Week Hypertrophy Program" : "16-Week Recomp Strategy", weeks: type === "program" ? 12 : 16, promptType: type, content: fullContent, isActive: true, startDate: new Date() } });
        }
        controller.close();
      } catch (err) {
        console.error("Stream error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Prompt-Type": type } });
}
