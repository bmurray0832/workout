import type { UserProfile, WeeklyCheckIn, PlateauLog } from "@prisma/client";
import { buildEquipmentContext } from "@/lib/equipment";

function getNutritionBlock(profile: UserProfile): string {
  if (!profile.dailyCalorieTarget) return "";
  return `
NUTRITION TARGETS: ${profile.dailyCalorieTarget} kcal/day · ${profile.proteinTargetG}g protein · ${profile.carbTargetG}g carbs · ${profile.fatTargetG}g fat · ${profile.mealsPerDay ?? 4} meals/day (${profile.nutritionPhase ?? "maintenance"} phase).${profile.nutritionNotes ? ` Dietary notes: ${profile.nutritionNotes}.` : ""}
Factor these targets into all recommendations.
`;
}

function getEquipmentBlock(profile: UserProfile): string {
  try {
    const ids: string[] = JSON.parse(profile.availableEquipment ?? "[]");
    if (ids.length === 0) return "";
    const context = buildEquipmentContext(ids);
    return `
EQUIPMENT CONSTRAINTS — STRICT RULE: You may ONLY program exercises using the equipment listed below.

Available equipment:
${context}
`;
  } catch {
    return "";
  }
}

export function buildProgramPrompt(profile: UserProfile): string {
  return `You are an elite personal trainer and strength coach with 15 years of experience working with intermediate natural athletes.
${getEquipmentBlock(profile)}${getNutritionBlock(profile)}
IMPORTANT INJURY CONTEXT: I have ${profile.injuryNotes ?? "no current injuries"}. ${
    profile.restrictedMovements
      ? `The following movements are restricted or must be modified: ${profile.restrictedMovements}.`
      : ""
  } Please build every lower body and posterior chain exercise around this.

I am an intermediate lifter. My stats: ${profile.weightLbs}lbs, ${profile.heightStr}, ${profile.age} years old, ${profile.sex}.

Estimated 1RMs:
- Bench press: ${profile.benchMaxLbs ?? "unknown"}lbs
- Squat: ${profile.squatMaxLbs ? `${profile.squatMaxLbs}lbs` : "limited due to injury — use leg press as primary lower body push"}
- Deadlift: ${profile.deadliftMaxLbs ?? "unknown"}lbs
- Overhead press: ${profile.ohpMaxLbs ?? "unknown"}lbs
- Leg press: ${profile.legPressMaxLbs ? `${profile.legPressMaxLbs}lbs (working weight)` : "unknown"}
- T-Bar Row: ${profile.tbarRowWeightLbs ? `${profile.tbarRowWeightLbs}lbs x 8-10 reps` : "unknown"}

I can train ${profile.trainingDaysPerWeek} days per week, sessions no longer than ${profile.sessionLengthMin} minutes.
Equipment: ${profile.equipment}. Primary goal: ${profile.primaryGoal}${profile.secondaryGoal ? ` / ${profile.secondaryGoal}` : ""}.

Design a complete 12-week periodized training program with full sessions, sets, reps, tempo, rest periods, progressive overload strategy, and deload weeks. For every lower body or posterior chain exercise, note how it accommodates my injury.`;
}

export function buildPlateauPrompt(
  profile: UserProfile,
  plateaus: Pick<PlateauLog, "exerciseName" | "stalledWeeks" | "lastWeight">[],
  currentProgram?: string,
  recentCheckIn?: WeeklyCheckIn | null
): string {
  const stallList = plateaus
    .map((p) => `- ${p.exerciseName}: stuck at ${p.lastWeight}lbs for ${p.stalledWeeks}+ weeks`)
    .join("\n");

  return `You are a strength coach who specializes in diagnosing and fixing training plateaus in intermediate lifters.
${getEquipmentBlock(profile)}${getNutritionBlock(profile)}
INJURY CONTEXT: ${profile.injuryNotes ?? "none"}. ${profile.restrictedMovements ? `Restricted: ${profile.restrictedMovements}.` : ""}

Stats: ${profile.weightLbs}lbs, ${profile.heightStr}, ${profile.age}yo ${profile.sex}. Training: ${profile.trainingDaysPerWeek} days/week, ${profile.sessionLengthMin} min sessions.

Stalled lifts:
${stallList || "General plateau across main lifts"}

${currentProgram ? `Current program:\n${currentProgram}\n` : ""}${
  recentCheckIn
    ? `Recent check-in: ${recentCheckIn.bodyweightLbs}lbs, sleep ${recentCheckIn.sleepHours}h (${recentCheckIn.sleepQuality}/10), stress ${recentCheckIn.stressLevel}, energy ${recentCheckIn.energyScore}/10, recovery ${recentCheckIn.recoveryScore}/10.${recentCheckIn.struggles ? ` Struggles: ${recentCheckIn.struggles}` : ""}\n`
    : ""
}

Analyze every possible cause of my plateau and build an 8-week plan to break through each stall.`;
}

export function buildWeakPointPrompt(
  profile: UserProfile,
  aestheticWeakPoints: string,
  performanceWeakPoints: string,
  currentProgram?: string
): string {
  return `You are a physique coach and movement specialist.
${getEquipmentBlock(profile)}${getNutritionBlock(profile)}
INJURY CONTEXT: ${profile.injuryNotes ?? "none"}. ${profile.restrictedMovements ? `Restricted: ${profile.restrictedMovements}.` : ""}

Stats: ${profile.weightLbs}lbs, ${profile.heightStr}, ${profile.age}yo ${profile.sex}.

Aesthetic weak points: ${aestheticWeakPoints}
Performance weak points: ${performanceWeakPoints}

${currentProgram ? `Current program:\n${currentProgram}` : ""}

For each weak point: diagnose the root cause, provide corrective exercises with sets/reps/cues, and give a realistic improvement timeline.`;
}

export function buildRecoveryPrompt(profile: UserProfile): string {
  return `You are a sports science expert and recovery specialist.
${getNutritionBlock(profile)}
I train ${profile.trainingDaysPerWeek} days/week. Stats: ${profile.weightLbs}lbs, ${profile.heightStr}, ${profile.age}yo ${profile.sex}. Injury: ${profile.injuryNotes ?? "none"}.

Build a complete recovery protocol: sleep routine, daily mobility (max 20 min), nervous system downregulation, deload strategy, nutrition for recovery, evidence-based supplementation with dosing, and early warning signs of under-recovery.`;
}

export function buildInjuryPreventionPrompt(profile: UserProfile): string {
  return `You are a sports physiotherapist and strength coach.
${getEquipmentBlock(profile)}${getNutritionBlock(profile)}
CRITICAL: I have ${profile.injuryNotes ?? "no current injuries"}. ${profile.restrictedMovements ? `Restricted: ${profile.restrictedMovements}.` : ""}

Stats: ${profile.weightLbs}lbs, ${profile.heightStr}, ${profile.age}yo ${profile.sex}. Training ${profile.trainingDaysPerWeek}x/week.

Build a proactive injury prevention plan: common injuries per lift, prehab routine (max 20 min 3x/week), smart warm-up protocol, how to train around niggles, and technique adjustments to reduce joint stress.`;
}

export function buildTrackerPrompt(
  profile: UserProfile,
  checkIns: WeeklyCheckIn[],
  currentProgram?: string
): string {
  const checkInSummary = checkIns
    .slice(-8)
    .map(
      (c, i) =>
        `Week ${i + 1}: ${c.bodyweightLbs}lbs | Sleep: ${c.sleepHours}h (${c.sleepQuality}/10) | Energy: ${c.energyScore}/10 | Recovery: ${c.recoveryScore}/10 | Stress: ${c.stressLevel}${c.avgCalories ? ` | Cals: ${c.avgCalories}` : ""}${c.avgProteinG ? ` | Protein: ${c.avgProteinG}g` : ""}`
    )
    .join("\n");

  return `You are a data-driven performance coach.

Stats: ${profile.weightLbs}lbs starting, ${profile.heightStr}, ${profile.age}yo ${profile.sex}. Goal: ${profile.primaryGoal}. Injury: ${profile.injuryNotes ?? "none"}.

${currentProgram ? `Active program: ${currentProgram}\n` : ""}

Weekly data:\n${checkInSummary || "No check-ins yet."}

Analyze trends across bodyweight, sleep, energy, recovery, and stress. Give data-driven decisions on exactly what to change and why. Provide monthly review and reset targets for the next block.`;
}

export function buildRecompPrompt(
  profile: UserProfile,
  bodyFatPercent?: number
): string {
  return `You are an elite strength coach and sports nutritionist specializing in body recomposition.
${getEquipmentBlock(profile)}${getNutritionBlock(profile)}
INJURY CONTEXT: ${profile.injuryNotes ?? "none"}. ${profile.restrictedMovements ? `Restricted: ${profile.restrictedMovements}.` : ""}

Stats: ${profile.weightLbs}lbs, ${profile.heightStr}, ${profile.age}yo, ${profile.sex}${bodyFatPercent ? `, ~${bodyFatPercent}% body fat` : ""}.
Training ${profile.trainingDaysPerWeek} days/week.

Current lifts: Bench ~${profile.benchMaxLbs ?? "unknown"}lbs, Deadlift ~${profile.deadliftMaxLbs ?? "unknown"}lbs, Leg press ~${profile.legPressMaxLbs ?? "unknown"}lbs, OHP ~${profile.ohpMaxLbs ?? "unknown"}lbs.

Build a complete 16-week recomposition blueprint with training program, nutrition strategy, cardio plan, tracking protocol, and adjustment checkpoints at weeks 4, 8, and 12.`;
}
