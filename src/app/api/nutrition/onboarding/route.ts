import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const profile = await db.userProfile.upsert({
    where: { id: 1 },
    update: {
      favoriteMeals: data.favoriteMeals,
      hatedFoods: data.hatedFoods,
      dietaryRestrictions: data.dietaryRestrictions || null,
      cookingStyle: data.cookingStyle || null,
      foodAdventurousness: data.foodAdventurousness ? Number(data.foodAdventurousness) : null,
      currentSnacks: data.currentSnacks,
      snackReason: data.snackReason || null,
      snackPreference: data.snackPreference || null,
      lateNightSnacking: data.lateNightSnacking ?? null,
      jobType: data.jobType || null,
      typicalSleepHours: data.typicalSleepHours ? Number(data.typicalSleepHours) : null,
      baselineStressLevel: data.baselineStressLevel || null,
      alcoholDrinksPerWeek: data.alcoholDrinksPerWeek !== undefined ? Number(data.alcoholDrinksPerWeek) : null,
      dailyStepTarget: data.dailyStepTarget ? Number(data.dailyStepTarget) : null,
      nutritionOnboarded: true,
    },
    create: {
      id: 1,
      name: "User",
      weightLbs: 0,
      heightStr: "",
      age: 0,
      sex: "male",
      trainingDaysPerWeek: 4,
      sessionLengthMin: 60,
      equipment: "full commercial gym",
      primaryGoal: "fat loss",
      nutritionOnboarded: true,
    },
  });

  return NextResponse.json(profile);
}
