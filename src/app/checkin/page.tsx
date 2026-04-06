"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CheckIn = { id: number; date: string; bodyweightLbs: number; sleepHours: number; sleepQuality: number; stressLevel: string; energyScore: number; recoveryScore: number; avgCalories: number | null; avgProteinG: number | null; nutritionNotes: string | null; wins: string | null; struggles: string | null; notes: string | null };

const STRESS_OPTIONS = ["low", "moderate", "high"] as const;

function ScoreButton({ value, selected, onClick, color = "blue" }: { value: number; selected: boolean; onClick: () => void; color?: "blue" | "green" | "orange" }) {
  const colors = { blue: selected ? "bg-amber-500 border-amber-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300", green: selected ? "bg-green-700 border-green-600 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300", orange: selected ? "bg-orange-700 border-orange-600 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300" };
  return <button type="button" onClick={onClick} className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${colors[color]}`}>{value}</button>;
}

export default function CheckInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPlateaus, setNewPlateaus] = useState<{ exerciseName: string; stalledWeeks: number }[]>([]);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [daysAgo, setDaysAgo] = useState<number | null>(null);
  const [form, setForm] = useState({ bodyweightLbs: "", sleepHours: "", sleepQuality: 7, stressLevel: "moderate" as "low" | "moderate" | "high", energyScore: 7, recoveryScore: 7, avgCalories: "", avgProteinG: "", nutritionNotes: "", wins: "", struggles: "", notes: "" });

  useEffect(() => {
    fetch("/api/checkin?limit=8").then((r) => r.json()).then((data: CheckIn[]) => {
      setHistory(data);
      if (data.length > 0) {
        const last = data[0];
        setLastCheckIn(last);
        setDaysAgo(Math.floor((Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24)));
        setForm((prev) => ({ ...prev, bodyweightLbs: String(last.bodyweightLbs) }));
      }
    });
  }, []);

  const setScore = (field: "sleepQuality" | "energyScore" | "recoveryScore", val: number) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bodyweightLbs: parseFloat(form.bodyweightLbs), sleepHours: parseFloat(form.sleepHours), sleepQuality: form.sleepQuality, stressLevel: form.stressLevel, energyScore: form.energyScore, recoveryScore: form.recoveryScore, avgCalories: form.avgCalories ? parseInt(form.avgCalories) : null, avgProteinG: form.avgProteinG ? parseInt(form.avgProteinG) : null, nutritionNotes: form.nutritionNotes || null, wins: form.wins || null, struggles: form.struggles || null, notes: form.notes || null, date: new Date().toISOString() }) });
      const plateaus = await fetch("/api/plateaus").then((r) => r.json()).catch(() => []);
      setNewPlateaus(plateaus ?? []);
      setSaved(true);
      setTimeout(() => router.push("/"), plateaus?.length > 0 ? 4000 : 1500);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (saved) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
      <div className="text-5xl">✓</div>
      <h2 className="text-xl font-bold">Check-in saved</h2>
      <p className="text-zinc-400 text-sm">Your data is feeding into plateau detection and progress analysis.</p>
      {newPlateaus.length > 0 && (
        <div className="mt-2 w-full max-w-sm bg-orange-950 border border-orange-700 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-orange-300">{newPlateaus.length} plateau{newPlateaus.length > 1 ? "s" : ""} detected</p>
          {newPlateaus.map((p, i) => (
            <p key={i} className="text-xs text-orange-400">{p.exerciseName} — stalled {p.stalledWeeks} week{p.stalledWeeks > 1 ? "s" : ""}</p>
          ))}
          <button onClick={() => router.push("/plateaus")} className="mt-1 w-full text-xs bg-orange-800 hover:bg-orange-700 text-white py-2 rounded-lg transition-colors">View Plateaus →</button>
        </div>
      )}
    </div>
  );

  const INPUT = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white text-sm">← Dashboard</button>
        <span className="font-semibold text-sm">Weekly Check-In</span>
        <div className="w-16" />
      </header>
      {lastCheckIn && (
        <div className={`px-4 py-2 text-xs text-center ${daysAgo !== null && daysAgo >= 7 ? "bg-orange-950 border-b border-orange-800 text-orange-300" : "bg-zinc-950 border-b border-zinc-800 text-zinc-400"}`}>
          {daysAgo === 0 ? "You already checked in today." : daysAgo === 1 ? "Last check-in: yesterday" : `Last check-in: ${daysAgo} days ago`}{daysAgo !== null && daysAgo >= 7 && " — overdue!"}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        <Section title="Body">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Bodyweight (lbs) <span className="text-red-400">*</span></label><input type="number" step="0.1" value={form.bodyweightLbs} onChange={(e) => setForm((p) => ({ ...p, bodyweightLbs: e.target.value }))} placeholder="253" required className={INPUT} /></div>
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Avg sleep (hrs/night) <span className="text-red-400">*</span></label><input type="number" step="0.5" value={form.sleepHours} onChange={(e) => setForm((p) => ({ ...p, sleepHours: e.target.value }))} placeholder="7.5" required className={INPUT} /></div>
          </div>
        </Section>
        <Section title="Recovery Scores">
          <div className="space-y-4">
            {(["sleepQuality", "energyScore", "recoveryScore"] as const).map((field) => (
              <div key={field}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-sm text-zinc-300">{field === "sleepQuality" ? "Sleep quality" : field === "energyScore" ? "Energy" : "Recovery"}</p>
                  <p className="text-xs text-zinc-500">{field === "sleepQuality" ? "How rested do you feel?" : field === "energyScore" ? "Overall energy through the day" : "How recovered do your muscles feel?"}</p>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map((v) => <ScoreButton key={v} value={v} selected={form[field] === v} onClick={() => setScore(field, v)} color={field === "sleepQuality" ? "blue" : "green"} />)}
                </div>
              </div>
            ))}
            <div>
              <p className="text-sm text-zinc-300 mb-2">Stress level</p>
              <div className="flex gap-2">
                {STRESS_OPTIONS.map((level) => (
                  <button key={level} type="button" onClick={() => setForm((p) => ({ ...p, stressLevel: level }))} className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${form.stressLevel === level ? level === "low" ? "bg-green-700 border-green-600 text-white" : level === "moderate" ? "bg-yellow-700 border-yellow-600 text-white" : "bg-red-800 border-red-700 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-300"}`}>{level}</button>
                ))}
              </div>
            </div>
          </div>
        </Section>
        <Section title="Nutrition (optional)">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Avg calories</label><input type="number" value={form.avgCalories} onChange={(e) => setForm((p) => ({ ...p, avgCalories: e.target.value }))} placeholder="2400" className={INPUT} /></div>
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Avg protein (g)</label><input type="number" value={form.avgProteinG} onChange={(e) => setForm((p) => ({ ...p, avgProteinG: e.target.value }))} placeholder="200" className={INPUT} /></div>
          </div>
          <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Nutrition notes</label><input type="text" value={form.nutritionNotes} onChange={(e) => setForm((p) => ({ ...p, nutritionNotes: e.target.value }))} placeholder="e.g. ate well Mon-Fri, went off track weekend" className={INPUT} /></div>
        </Section>
        <Section title="Weekly Reflection">
          <div className="space-y-3">
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Wins this week</label><textarea value={form.wins} onChange={(e) => setForm((p) => ({ ...p, wins: e.target.value }))} placeholder="e.g. hit a new bench PR" rows={2} className={`${INPUT} resize-none`} /></div>
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Struggles this week</label><textarea value={form.struggles} onChange={(e) => setForm((p) => ({ ...p, struggles: e.target.value }))} placeholder="e.g. back felt tight, missed Tuesday" rows={2} className={`${INPUT} resize-none`} /></div>
            <div className="flex flex-col gap-1"><label className="text-sm text-zinc-300">Other notes</label><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Anything else..." rows={2} className={`${INPUT} resize-none`} /></div>
          </div>
        </Section>
        {history.length > 1 && (
          <Section title="Bodyweight Trend">
            <div className="space-y-1.5">
              {history.slice(0, 6).reverse().map((c) => {
                const maxW = Math.max(...history.map((h) => h.bodyweightLbs));
                const minW = Math.min(...history.map((h) => h.bodyweightLbs));
                const barW = ((c.bodyweightLbs - minW) / (maxW - minW || 1)) * 60 + 40;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-14 shrink-0">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <div className="flex-1 bg-zinc-900 rounded-full h-1.5"><div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${barW}%` }} /></div>
                    <span className="text-xs font-mono w-14 text-right">{c.bodyweightLbs}lbs</span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
        <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors">{loading ? "Saving..." : "Save Check-In →"}</button>
        <div className="h-6" />
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4"><h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h3>{children}</div>;
}
