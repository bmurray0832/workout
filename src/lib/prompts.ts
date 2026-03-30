import type { UserProfile, WeeklyCheckIn, PlateauLog, Program } from "@prisma/client";
import { buildEquipmentContext } from "@/lib/equipment";

function getNutritionBlock(profile: UserProfile): string {
  if (!profile.dailyCalorieTarget) return "";
  let block = `
NUTRITION TARGETS: ${profile.dailyCalorieTarget} kcal/day · ${profile.proteinTargetG}g protein · ${profile.carbTargetG}g carbs · ${profile.fatTargetG}g fat · ${profile.mealsPerDay ?? 4} meals/day (${profile.nutritionPhase ?? "maintenance"} phase).${profile.nutritionNotes ? ` Dietary notes: ${profile.nutritionNotes}.` : ""}
Factor these targets into all recommendations.
`;
  if (profile.nutritionOnboarded) {
    if (profile.dietaryRestrictions) block += `Dietary restrictions: ${profile.dietaryRestrictions}.\n`;
    if (profile.favoriteMeals) {
      try { const meals = JSON.parse(profile.favoriteMeals); if (meals.length) block += `Favourite meals: ${meals.join(", ")}.\n`; } catch {}
    }
    if (profile.jobType) block += `Job type: ${profile.jobType}.\n`;
  }
  return block;
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

function getFoodPreferencesBlock(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.favoriteMeals) {
    try { const meals = JSON.parse(profile.favoriteMeals); if (meals.length) parts.push(`My top favourite meals/dishes: ${meals.join(", ")}`); } catch {}
  }
  if (profile.hatedFoods) {
    try { const foods = JSON.parse(profile.hatedFoods); if (foods.length) parts.push(`Foods I absolutely hate and will never eat: ${foods.join(", ")}`); } catch {}
  }
  if (profile.dietaryRestrictions) parts.push(`Dietary restrictions/allergies: ${profile.dietaryRestrictions}`);
  if (profile.cookingStyle) {
    const styles: Record<string, string> = { scratch: "cooking from scratch", quick: "quick meals (under 15 mins)", batch: "batch cooking / meal prep" };
    parts.push(`Cooking preference: ${styles[profile.cookingStyle] ?? profile.cookingStyle}`);
  }
  if (profile.foodAdventurousness) parts.push(`Food adventurousness: ${profile.foodAdventurousness}/10`);
  return parts.length ? parts.join("\n") : "No specific food preferences provided.";
}

function getSnackBlock(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.currentSnacks) {
    try { const snacks = JSON.parse(profile.currentSnacks); if (snacks.length) parts.push(`Current snacks I reach for: ${snacks.join(", ")}`); } catch {}
  }
  if (profile.snackReason) parts.push(`I tend to snack out of: ${profile.snackReason}`);
  if (profile.snackPreference) parts.push(`I prefer: ${profile.snackPreference} snacks`);
  if (profile.lateNightSnacking !== null && profile.lateNightSnacking !== undefined) parts.push(`Late night snacking: ${profile.lateNightSnacking ? "yes" : "no"}`);
  return parts.length ? parts.join("\n") : "No snack habits provided.";
}

function getLifestyleBlock(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.jobType) {
    const jobs: Record<string, string> = { sedentary: "desk job / sedentary", light: "lightly active job", active: "active job (on my feet)", very_active: "very active / physical job", manual: "heavy manual labour" };
    parts.push(`Job type: ${jobs[profile.jobType] ?? profile.jobType}`);
  }
  parts.push(`Training: ${profile.trainingDaysPerWeek} days/week, ${profile.sessionLengthMin} min sessions`);
  if (profile.typicalSleepHours) parts.push(`Typical sleep: ${profile.typicalSleepHours} hours/night`);
  if (profile.baselineStressLevel) parts.push(`Stress level: ${profile.baselineStressLevel}`);
  if (profile.alcoholDrinksPerWeek !== null && profile.alcoholDrinksPerWeek !== undefined) {
    parts.push(profile.alcoholDrinksPerWeek === 0 ? "Alcohol: none" : `Alcohol: ~${profile.alcoholDrinksPerWeek} drinks per week`);
  }
  if (profile.dailyStepTarget) parts.push(`Daily step target: ${profile.dailyStepTarget}`);
  return parts.join("\n");
}

export function buildMealPlanPrompt(profile: UserProfile, activeProgram?: Pick<Program, "name" | "content"> | null): string {
  const weightKg = (profile.weightLbs / 2.205).toFixed(1);

  return `Act as an expert nutritionist with 30 years of experience helping clients lose body fat sustainably without miserable dieting. You've worked with everyone from busy parents to athletes getting shredded for competition. You know that lasting fat loss isn't bland food and brutal restriction — it's finding an approach that fits the person. Your tone is encouraging, knowledgeable, and straight-talking — like a brilliant friend who happens to have a nutrition degree.

## MY STATS
- Age: ${profile.age}
- Sex: ${profile.sex}
- Height: ${profile.heightStr}
- Current weight: ${profile.weightLbs}lbs (${weightKg}kg)
- Current phase: ${profile.nutritionPhase ?? "cut"}

## MY LIFESTYLE
${getLifestyleBlock(profile)}

## MY FOOD PREFERENCES
${getFoodPreferencesBlock(profile)}

## MY SNACK HABITS
${getSnackBlock(profile)}

## MY INJURY CONTEXT
${profile.injuryNotes ?? "No current injuries."}${profile.restrictedMovements ? ` Restricted movements: ${profile.restrictedMovements}.` : ""}

## MY CURRENT NUTRITION TARGETS (already calculated)
- Daily calories: ${profile.dailyCalorieTarget ?? "not set"} kcal
- Protein: ${profile.proteinTargetG ?? "not set"}g
- Carbs: ${profile.carbTargetG ?? "not set"}g
- Fat: ${profile.fatTargetG ?? "not set"}g
- Meals per day: ${profile.mealsPerDay ?? 4}
${profile.nutritionNotes ? `- Notes: ${profile.nutritionNotes}` : ""}

${activeProgram ? `## MY ACTIVE TRAINING PROGRAMME\n${activeProgram.name}\n${activeProgram.content.slice(0, 800)}\n...\n` : "## TRAINING\nNo active programme yet. Design nutrition for someone training ${profile.trainingDaysPerWeek} days/week."}

---

Now build my complete nutrition plan. Use the following section headers EXACTLY as shown so the app can parse them:

## CALORIE CALCULATION
Show the full Mifflin-St Jeor calculation step by step:
- Men: (10 x weight in kg) + (6.25 x height in cm) - (5 x age) + 5
- Women: (10 x weight in kg) + (6.25 x height in cm) - (5 x age) - 161
Apply the most appropriate activity multiplier based on BOTH my job AND training combined (1.2 sedentary to 1.9 extremely active). Show every number.
Warn that online calculators are often inaccurate for active people. Recommend tracking real food intake for 2 weeks as the gold standard.
Confirm alignment with my pre-set targets, or flag if they seem off.
Set a deficit of ~500 kcal below TDEE for steady fat loss (~1lb/week). Never go below 500 kcal under TDEE for active individuals.

## MACRO TARGETS
Give daily protein, carb, and fat targets in grams. Explain why each is set at that level in plain English. Prioritise protein to preserve muscle during the cut. Also break these down per meal for my ${profile.mealsPerDay ?? 4} meals/day.

## 7-DAY MEAL PLAN
Build a fun, exciting 7-day meal plan with breakfast, lunch, dinner, and one optional dessert per day.
Rules:
- Every day MUST hit my calorie and macro targets across all meals combined
- Protein must hit daily target across the full day
- No boring chicken and broccoli unless I specifically asked for it
- Give every day a fun theme (e.g. "Monday: Mediterranean Monday", "Tuesday: Tex-Mex Tuesday")
- Include calorie and macro counts (protein/carbs/fat) for EVERY meal
- Flag meals that are great for batch cooking or meal prep with [MEAL PREP]
- Include at least 2 meals per week that feel like a treat but are secretly low calorie — mark with [TREAT]
- If I drink alcohol, factor those calories into relevant days
- Use my favourite meals/cuisines as inspiration
- Avoid any foods I said I hate

## SNACK SWAPS
Look at the snacks I currently eat. For each one, suggest a healthier alternative that scratches the same itch — sweet for sweet, crunchy for crunchy. Give at least 5 snack options with calorie and protein counts. Make them exciting.

## PERSONAL RULES
Give me 5 personalised fat loss rules based on everything about ME — not generic advice. Make them specific to my job, stress, alcohol habits, cooking style, schedule, and lifestyle. These should feel like they were written for me and no one else.

## TIMELINE
Tell me honestly and encouragingly what I can expect following this plan. Give a month-by-month projection over 12 weeks. Be real — no false promises — but keep me motivated.

## HYDRATION
Calculate my daily water intake target:
- Base: 35ml per kg of bodyweight
- Add 500ml for every hour of exercise
- Add 500-1000ml for physical/outdoor jobs
Give 3-4 practical tips specific to my lifestyle to hit my target.
Explain how hydration affects hunger, metabolism, gym performance, and energy.

## SUPPLEMENTS
Recommend ONLY evidence-backed supplements relevant to me. Consider: whey protein, creatine monohydrate (3-5g daily), caffeine (strategic use, cut off by midday for cortisol management), vitamin D, omega-3 fish oil, magnesium glycinate (for sleep and stress/cortisol reduction).
For each: dose, best time to take it, why it's relevant to ME specifically, and a budget-friendly suggestion.
Be clear: supplements are the 1%. Food, training, sleep, and consistency are the 99%.

---

Throughout everything, keep the tone fun, warm, and motivating. Make me feel like I have a world-class nutritionist in my corner.`;
}
