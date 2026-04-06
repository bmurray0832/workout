"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type NutritionGoals = { nutritionPhase: string; dailyCalorieTarget: number; proteinTargetG: number; carbTargetG: number; fatTargetG: number; mealsPerDay: number; nutritionNotes: string };

const PHASES = [
  { id: "bulk", label: "Bulk", desc: "Build muscle, slight calorie surplus" },
  { id: "cut", label: "Cut", desc: "Lose fat, calorie deficit" },
  { id: "maintain", label: "Maintain", desc: "Hold weight, body recomp" },
  { id: "recomp", label: "Recomp", desc: "Build muscle + lose fat simultaneously" },
];

export default function NutritionPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [phase, setPhase] = useState("bulk");
  const [notes, setNotes] = useState("");
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [goalsFromProfile, setGoalsFromProfile] = useState(false);
  const [streamedRationale, setStreamedRationale] = useState("");
  const rationaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setProfile(p);
      if (p?.nutritionPhase) setPhase(p.nutritionPhase);
      if (p?.nutritionNotes) setNotes(p.nutritionNotes);
      if (p?.dailyCalorieTarget) { setGoals({ nutritionPhase: p.nutritionPhase, dailyCalorieTarget: p.dailyCalorieTarget, proteinTargetG: p.proteinTargetG, carbTargetG: p.carbTargetG, fatTargetG: p.fatTargetG, mealsPerDay: p.mealsPerDay ?? 4, nutritionNotes: p.nutritionNotes ?? "" }); setGoalsFromProfile(true); }
    });
  }, []);

  useEffect(() => { if (rationaleRef.current) rationaleRef.current.scrollTop = rationaleRef.current.scrollHeight; }, [streamedRationale]);

  const calculateTargets = async () => {
    setCalculating(true); setStreamedRationale(""); setGoals(null); setGoalsFromProfile(false);
    try {
      const res = await fetch("/api/nutrition/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase, notes }) });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value); setStreamedRationale(full); }
      const jsonMatch = full.match(/\{[\s\S]*"dailyCalorieTarget"[\s\S]*\}/);
      if (jsonMatch) setGoals({ ...JSON.parse(jsonMatch[0]), nutritionPhase: phase, nutritionNotes: notes });
    } catch (err) { console.error(err); } finally { setCalculating(false); }
  };

  const saveGoals = async () => {
    if (!goals) return;
    setSaving(true);
    try {
      await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nutritionPhase: goals.nutritionPhase, dailyCalorieTarget: goals.dailyCalorieTarget, proteinTargetG: goals.proteinTargetG, carbTargetG: goals.carbTargetG, fatTargetG: goals.fatTargetG, mealsPerDay: goals.mealsPerDay, nutritionNotes: goals.nutritionNotes, nutritionCalculated: true }) });
      setSaved(true); setTimeout(() => router.push("/"), 1200);
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-black z-10">
        <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white text-sm">← Dashboard</button>
        <span className="font-semibold text-sm">Nutrition Goals</span>
        <div className="w-16" />
      </header>
      <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        {profile && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
            Claude will calculate your targets using: <span className="text-white">{String(profile.weightLbs)}lbs · {String(profile.heightStr)} · {String(profile.age)}yo · {String(profile.trainingDaysPerWeek)} training days/week</span>
          </div>
        )}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Current Phase</h3>
          <div className="grid grid-cols-2 gap-2">
            {PHASES.map((p) => (
              <button key={p.id} onClick={() => { setPhase(p.id); setSaved(false); setGoals(null); setGoalsFromProfile(false); }} className={`p-3 rounded-lg border text-left transition-colors ${phase === p.id ? "border-amber-500 bg-amber-950" : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"}`}>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Dietary Notes (optional)</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. no dairy, eat 4 meals a day, high protein preference..." rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none" />
        </div>
        <button onClick={calculateTargets} disabled={calculating} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-colors">{calculating ? "Calculating..." : goals ? "Recalculate Targets" : "Calculate My Targets →"}</button>
        {streamedRationale && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="px-4 py-2 border-b border-zinc-800"><p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{calculating ? <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />Claude is calculating...</span> : "Rationale"}</p></div>
            <div ref={rationaleRef} className="p-4 max-h-48 overflow-y-auto text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{streamedRationale}{calculating && <span className="animate-pulse">▌</span>}</div>
          </div>
        )}
        {goals && !calculating && (
          <div className="bg-zinc-950 border border-amber-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{goalsFromProfile ? "Active Saved Targets" : "Calculated Targets"}</h3>
              {goalsFromProfile && <span className="text-xs bg-green-900 border border-green-700 text-green-400 px-2 py-0.5 rounded-full">✓ saved</span>}
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <MacroCard label="Calories" value={String(goals.dailyCalorieTarget)} unit="kcal" color="blue" />
              <MacroCard label="Protein" value={String(goals.proteinTargetG)} unit="g" color="red" />
              <MacroCard label="Carbs" value={String(goals.carbTargetG)} unit="g" color="yellow" />
              <MacroCard label="Fat" value={String(goals.fatTargetG)} unit="g" color="orange" />
            </div>
            <div className="mb-4">
              <p className="text-xs text-zinc-500 mb-1">Macro split</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {(() => { const t = goals.proteinTargetG * 4 + goals.carbTargetG * 4 + goals.fatTargetG * 9; return (<><div className="bg-red-500 rounded-l-full" style={{ width: `${(goals.proteinTargetG * 4 / t) * 100}%` }} /><div className="bg-yellow-500" style={{ width: `${(goals.carbTargetG * 4 / t) * 100}%` }} /><div className="bg-orange-500 rounded-r-full" style={{ width: `${(goals.fatTargetG * 9 / t) * 100}%` }} /></>); })()}
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span className="text-red-400">Protein {Math.round((goals.proteinTargetG * 4 / goals.dailyCalorieTarget) * 100)}%</span>
                <span className="text-yellow-400">Carbs {Math.round((goals.carbTargetG * 4 / goals.dailyCalorieTarget) * 100)}%</span>
                <span className="text-orange-400">Fat {Math.round((goals.fatTargetG * 9 / goals.dailyCalorieTarget) * 100)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-800">
              <span className="text-sm text-zinc-300">Meals per day</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setGoals((g) => g ? { ...g, mealsPerDay: Math.max(2, g.mealsPerDay - 1) } : g)} className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors">−</button>
                <span className="text-sm font-medium w-4 text-center">{goals.mealsPerDay}</span>
                <button onClick={() => setGoals((g) => g ? { ...g, mealsPerDay: Math.min(8, g.mealsPerDay + 1) } : g)} className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors">+</button>
              </div>
            </div>
            <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">Per meal (~{goals.mealsPerDay} meals): {Math.round(goals.dailyCalorieTarget / goals.mealsPerDay)} kcal · {Math.round(goals.proteinTargetG / goals.mealsPerDay)}g protein · {Math.round(goals.carbTargetG / goals.mealsPerDay)}g carbs · {Math.round(goals.fatTargetG / goals.mealsPerDay)}g fat</div>
            <button onClick={saveGoals} disabled={saving} className={`mt-4 w-full font-semibold py-3 rounded-xl transition-colors ${saved ? "bg-green-700 text-white" : "bg-amber-500 hover:bg-amber-400 text-white"} disabled:bg-zinc-800`}>{saving ? "Saving..." : saved ? "✓ Saved — Redirecting..." : "Save These Targets →"}</button>
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}

function MacroCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: "blue" | "red" | "yellow" | "orange" }) {
  const colors = { blue: "text-amber-400", red: "text-red-400", yellow: "text-yellow-400", orange: "text-orange-400" };
  return <div className="bg-zinc-900 rounded-lg p-2 text-center"><p className={`text-lg font-bold ${colors[color]}`}>{value}</p><p className="text-xs text-zinc-500">{unit}</p><p className="text-xs text-zinc-400 mt-0.5">{label}</p></div>;
}
