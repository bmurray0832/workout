"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type NutritionPlan = {
  id: number;
  phase: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealPlan: string;
  snackSwaps: string | null;
  personalRules: string | null;
  timeline: string | null;
  hydration: string | null;
  supplements: string | null;
  createdAt: string;
};

const TABS = [
  { key: "mealPlan", label: "Macros & Guidelines" },
  { key: "snackSwaps", label: "Dangerous Snacks" },
  { key: "personalRules", label: "My Rules" },
  { key: "timeline", label: "Timeline" },
  { key: "hydration", label: "Hydration" },
  { key: "supplements", label: "Supplements" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function MealPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("mealPlan");

  useEffect(() => {
    fetch("/api/nutrition/plan/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setPlan(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
          <span className="font-semibold text-sm">Nutrition Guide</span>
          <div className="w-16" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-gray-400 mb-4">No nutrition guide generated yet.</p>
          <button onClick={() => router.push("/nutrition")} className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">Go to Nutrition →</button>
        </div>
      </div>
    );
  }

  const tabContent = plan[activeTab];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
        <span className="font-semibold text-sm">Nutrition Guide</span>
        <button onClick={() => router.push("/nutrition")} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg">Regenerate</button>
      </header>

      {/* Macro summary */}
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4 text-xs">
          <span className="text-gray-500">Phase:</span>
          <span className="text-white font-medium capitalize">{plan.phase}</span>
          <span className="text-gray-700">|</span>
          <span className="text-blue-400">{plan.dailyCalories} kcal</span>
          <span className="text-red-400">{plan.proteinG}g protein</span>
          <span className="text-yellow-400">{plan.carbsG}g carbs</span>
          <span className="text-orange-400">{plan.fatG}g fat</span>
          <span className="ml-auto text-gray-600">Generated {new Date(plan.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-4 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex gap-1 py-2">
          {TABS.map((tab) => {
            const hasContent = plan[tab.key];
            if (!hasContent && tab.key !== "mealPlan") return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {tabContent ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{tabContent}</div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>This section was not generated. Try regenerating your meal plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
