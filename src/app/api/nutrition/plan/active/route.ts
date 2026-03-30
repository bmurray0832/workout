import { NextResponse } from "next/server";
import { getActiveNutritionPlan } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const plan = await getActiveNutritionPlan();
  if (!plan) return NextResponse.json(null);
  return NextResponse.json(plan);
}
