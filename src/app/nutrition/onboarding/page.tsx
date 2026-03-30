"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NutritionOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([""]);
  const [hatedFoods, setHatedFoods] = useState<string[]>([""]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [cookingStyle, setCookingStyle] = useState("quick");
  const [foodAdventurousness, setFoodAdventurousness] = useState(5);

  const [currentSnacks, setCurrentSnacks] = useState<string[]>([""]);
  const [snackReason, setSnackReason] = useState("hunger");
  const [snackPreference, setSnackPreference] = useState("both");
  const [lateNightSnacking, setLateNightSnacking] = useState(false);

  const [jobType, setJobType] = useState("sedentary");
  const [typicalSleepHours, setTypicalSleepHours] = useState(7);
  const [baselineStressLevel, setBaselineStressLevel] = useState("moderate");
  const [alcoholDrinksPerWeek, setAlcoholDrinksPerWeek] = useState(0);
  const [dailyStepTarget, setDailyStepTarget] = useState(8000);

  useEffect(() => {
    setLoading(true);
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p) return;
        if (p.favoriteMeals) try { const m = JSON.parse(p.favoriteMeals); if (m.length) setFavoriteMeals(m); } catch {}
        if (p.hatedFoods) try { const f = JSON.parse(p.hatedFoods); if (f.length) setHatedFoods(f); } catch {}
        if (p.dietaryRestrictions) setDietaryRestrictions(p.dietaryRestrictions);
        if (p.cookingStyle) setCookingStyle(p.cookingStyle);
        if (p.foodAdventurousness) setFoodAdventurousness(p.foodAdventurousness);
        if (p.currentSnacks) try { const s = JSON.parse(p.currentSnacks); if (s.length) setCurrentSnacks(s); } catch {}
        if (p.snackReason) setSnackReason(p.snackReason);
        if (p.snackPreference) setSnackPreference(p.snackPreference);
        if (p.lateNightSnacking !== null && p.lateNightSnacking !== undefined) setLateNightSnacking(p.lateNightSnacking);
        if (p.jobType) setJobType(p.jobType);
        if (p.typicalSleepHours) setTypicalSleepHours(p.typicalSleepHours);
        if (p.baselineStressLevel) setBaselineStressLevel(p.baselineStressLevel);
        if (p.alcoholDrinksPerWeek !== null && p.alcoholDrinksPerWeek !== undefined) setAlcoholDrinksPerWeek(p.alcoholDrinksPerWeek);
        if (p.dailyStepTarget) setDailyStepTarget(p.dailyStepTarget);
      })
      .finally(() => setLoading(false));
  }, []);

  const addItem = (list: string[], setList: (v: string[]) => void) => setList([...list, ""]);
  const removeItem = (list: string[], setList: (v: string[]) => void, idx: number) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== idx));
  };
  const updateItem = (list: string[], setList: (v: string[]) => void, idx: number, val: string) => {
    const updated = [...list];
    updated[idx] = val;
    setList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/nutrition/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteMeals: JSON.stringify(favoriteMeals.filter((m) => m.trim())),
          hatedFoods: JSON.stringify(hatedFoods.filter((f) => f.trim())),
          dietaryRestrictions: dietaryRestrictions || null,
          cookingStyle,
          foodAdventurousness,
          currentSnacks: JSON.stringify(currentSnacks.filter((s) => s.trim())),
          snackReason,
          snackPreference,
          lateNightSnacking,
          jobType,
          typicalSleepHours,
          baselineStressLevel,
          alcoholDrinksPerWeek,
          dailyStepTarget,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/nutrition");
    } catch (err) {
      setError("Something went wrong. Check the console.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <button onClick={() => router.push("/nutrition")} className="text-gray-400 hover:text-white text-sm">← Nutrition</button>
        <span className="font-semibold text-sm">Food & Lifestyle Profile</span>
        <div className="w-16" />
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Tell us about your food</h1>
          <p className="text-gray-400 text-sm">This helps Claude build a meal plan you will actually enjoy and stick to.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* FOOD PREFERENCES */}
          <Section title="Food Preferences">
            <ListInput label="Top favourite meals or dishes" items={favoriteMeals} setItems={setFavoriteMeals} placeholder="e.g. Chicken fajitas" addItem={addItem} removeItem={removeItem} updateItem={updateItem} />
            <ListInput label="Foods you hate / will never eat" items={hatedFoods} setItems={setHatedFoods} placeholder="e.g. Mushrooms" addItem={addItem} removeItem={removeItem} updateItem={updateItem} />
            <div className="flex flex-col gap-1 mt-4">
              <label className="text-sm font-medium text-gray-300">Dietary restrictions / allergies</label>
              <input type="text" value={dietaryRestrictions} onChange={(e) => setDietaryRestrictions(e.target.value)} placeholder="e.g. dairy-free, nut allergy" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">Cooking preference</label>
              <div className="grid grid-cols-3 gap-2">
                {([["scratch", "From scratch"], ["quick", "Quick meals"], ["batch", "Batch prep"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setCookingStyle(val)} className={`py-2 px-3 rounded-lg text-sm border transition-colors ${cookingStyle === val ? "border-blue-500 bg-blue-950 text-white" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">Food adventurousness: {foodAdventurousness}/10</label>
              <input type="range" min={1} max={10} value={foodAdventurousness} onChange={(e) => setFoodAdventurousness(Number(e.target.value))} className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Stick to basics</span><span>Try anything</span></div>
            </div>
          </Section>

          {/* SNACK HABITS */}
          <Section title="Snack Habits">
            <ListInput label="Snacks you currently reach for" items={currentSnacks} setItems={setCurrentSnacks} placeholder="e.g. Crisps, chocolate" addItem={addItem} removeItem={removeItem} updateItem={updateItem} />
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">Why do you snack?</label>
              <div className="grid grid-cols-3 gap-2">
                {([["hunger", "Hunger"], ["boredom", "Boredom"], ["habit", "Habit"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setSnackReason(val)} className={`py-2 px-3 rounded-lg text-sm border transition-colors ${snackReason === val ? "border-blue-500 bg-blue-950 text-white" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">Sweet or savory?</label>
              <div className="grid grid-cols-3 gap-2">
                {([["sweet", "Sweet"], ["savory", "Savory"], ["both", "Both"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setSnackPreference(val)} className={`py-2 px-3 rounded-lg text-sm border transition-colors ${snackPreference === val ? "border-blue-500 bg-blue-950 text-white" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Late night snacking?</label>
              <button type="button" onClick={() => setLateNightSnacking(!lateNightSnacking)} className={`w-12 h-6 rounded-full transition-colors relative ${lateNightSnacking ? "bg-blue-600" : "bg-gray-700"}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${lateNightSnacking ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          </Section>

          {/* LIFESTYLE */}
          <Section title="Lifestyle">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Job type</label>
              <div className="grid grid-cols-2 gap-2">
                {([["sedentary", "Desk job"], ["light", "Lightly active"], ["active", "On my feet"], ["very_active", "Physical job"], ["manual", "Manual labour"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setJobType(val)} className={`py-2 px-3 rounded-lg text-sm border transition-colors text-left ${jobType === val ? "border-blue-500 bg-blue-950 text-white" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Typical sleep (hours)</label>
                <input type="number" step="0.5" min={3} max={12} value={typicalSleepHours} onChange={(e) => setTypicalSleepHours(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Alcohol (drinks/week)</label>
                <input type="number" min={0} max={50} value={alcoholDrinksPerWeek} onChange={(e) => setAlcoholDrinksPerWeek(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">Stress level</label>
              <div className="grid grid-cols-3 gap-2">
                {([["low", "Low"], ["moderate", "Moderate"], ["high", "High"]] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setBaselineStressLevel(val)} className={`py-2 px-3 rounded-lg text-sm border transition-colors ${baselineStressLevel === val ? "border-blue-500 bg-blue-950 text-white" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Daily step target</label>
              <input type="number" step={1000} min={3000} max={20000} value={dailyStepTarget} onChange={(e) => setDailyStepTarget(Number(e.target.value))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              <p className="text-xs text-gray-500">Recommended: 8,000 - 10,000 steps/day</p>
            </div>
          </Section>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? "Saving..." : "Save & Continue to Nutrition"}
          </button>
          <div className="h-6" />
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ListInput({ label, items, setItems, placeholder, addItem, removeItem, updateItem }: {
  label: string; items: string[]; setItems: (v: string[]) => void; placeholder: string;
  addItem: (l: string[], s: (v: string[]) => void) => void;
  removeItem: (l: string[], s: (v: string[]) => void, i: number) => void;
  updateItem: (l: string[], s: (v: string[]) => void, i: number, v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 mt-1">
          <input type="text" value={item} onChange={(e) => updateItem(items, setItems, idx, e.target.value)} placeholder={placeholder} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          {items.length > 1 && <button type="button" onClick={() => removeItem(items, setItems, idx)} className="text-gray-500 hover:text-red-400 text-sm px-2">x</button>}
        </div>
      ))}
      <button type="button" onClick={() => addItem(items, setItems)} className="text-blue-400 hover:text-blue-300 text-xs mt-1 self-start">+ Add another</button>
    </div>
  );
}
