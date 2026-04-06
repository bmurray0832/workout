"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const EXERCISE_PRESETS: Record<string, string[]> = {
  "Chest": ["Bench Press", "Incline Bench Press", "Cable Fly", "Dumbbell Press", "Dips"],
  "Back": ["T-Bar Row", "Lat Pulldown", "Seated Cable Row", "Single Arm Row", "Face Pull"],
  "Shoulders": ["Overhead Press", "Lateral Raise", "Rear Delt Fly", "Arnold Press", "Upright Row"],
  "Legs": ["Leg Press", "Leg Extension", "Leg Curl", "Calf Raise", "Hip Thrust", "Romanian Deadlift"],
  "Arms": ["Barbell Curl", "Hammer Curl", "Tricep Pushdown", "Skull Crusher", "Cable Curl"],
  "Core": ["Cable Crunch", "Plank", "Ab Wheel", "Hanging Leg Raise"],
  "Compound": ["Deadlift", "Squat", "Pull Up", "Barbell Row"],
};

type Set = { reps: number; weightLbs: number; rpe?: number };
type ExerciseEntry = { exerciseName: string; muscleGroup: string; sets: Set[]; notes: string; saved: boolean };
type Session = { id: number; sessionName: string; date: string; completed: boolean };

export default function LogPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [customExercise, setCustomExercise] = useState("");
  const [sessionName, setSessionName] = useState("Today's Session");
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [restrictedMovements, setRestrictedMovements] = useState<string[]>([]);
  const [restrictedWarning, setRestrictedWarning] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.ok ? r.json() : null).then((p) => {
      if (p?.restrictedMovements) {
        setRestrictedMovements(p.restrictedMovements.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean));
      }
    });
  }, []);

  const startSession = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionName, date: new Date().toISOString() }),
      });
      setSession(await res.json());
    } catch (err) { console.error(err); } finally { setStarting(false); }
  };

  const addExercise = (name: string, muscleGroup = "Other") => {
    setExercises((prev) => [...prev, { exerciseName: name, muscleGroup, sets: [{ reps: 8, weightLbs: 0 }], notes: "", saved: false }]);
    setShowPresets(false);
    setCustomExercise("");
    const nameLower = name.toLowerCase();
    const matched = restrictedMovements.find((r) => nameLower.includes(r) || r.includes(nameLower));
    if (matched) setRestrictedWarning(name);
    else setRestrictedWarning(null);
  };

  const cancelSession = async () => {
    if (!session) { setSession(null); setExercises([]); return; }
    try {
      await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    } catch (_) { /* ignore */ }
    setSession(null);
    setExercises([]);
    setShowCancelConfirm(false);
    router.push("/");
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof Set, value: number) => {
    setExercises((prev) => prev.map((ex, i) => i === exIdx ? { ...ex, saved: false, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) } : ex));
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, saved: false, sets: [...ex.sets, { ...last }] };
    }));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => prev.map((ex, i) => i === exIdx ? { ...ex, saved: false, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex));
  };

  const removeExercise = (exIdx: number) => setExercises((prev) => prev.filter((_, i) => i !== exIdx));

  const saveExercise = async (exIdx: number) => {
    if (!session) return;
    setSaving(true);
    const ex = exercises[exIdx];
    try {
      await Promise.all(ex.sets.map((set) =>
        fetch(`/api/sessions/${session.id}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseName: ex.exerciseName, muscleGroup: ex.muscleGroup, sets: 1, reps: set.reps, weightLbs: set.weightLbs, rpe: set.rpe, notes: ex.notes }),
        })
      ));
      setExercises((prev) => prev.map((e, i) => i === exIdx ? { ...e, saved: true } : e));
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const completeSession = async () => {
    if (!session) return;
    setCompleting(true);
    try {
      for (let i = 0; i < exercises.length; i++) {
        if (!exercises[i].saved) await saveExercise(i);
      }
      await fetch(`/api/sessions/${session.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: true }) });
      router.push("/history");
    } catch (err) { console.error(err); } finally { setCompleting(false); }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold mb-2">Start a Session</h1>
            <p className="text-zinc-400 text-sm mb-6">Name it, then start logging.</p>
            <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Session name</label>
                <input type="text" value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" placeholder="e.g. Upper A, Push Day" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Upper A", "Lower A", "Upper B", "Lower B", "Push", "Pull"].map((name) => (
                  <button key={name} onClick={() => setSessionName(name)} className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 transition-colors">{name}</button>
                ))}
              </div>
            </div>
            <button onClick={startSession} disabled={starting} className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-colors">
              {starting ? "Starting..." : "Start Session →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <TopBar />
      <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{session.sessionName}</h2>
          <p className="text-xs text-zinc-400">{new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCancelConfirm(true)} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">Cancel</button>
          <button onClick={completeSession} disabled={completing || exercises.length === 0} className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {completing ? "Saving..." : exercises.some((e) => !e.saved) ? `✓ Complete (saving ${exercises.filter((e) => !e.saved).length} unsaved)` : "✓ Complete"}
          </button>
        </div>
      </div>
      {showCancelConfirm && (
        <div className="px-4 py-3 bg-red-950 border-b border-red-800 flex items-center justify-between gap-3">
          <p className="text-sm text-red-300">Discard this session? All exercises will be lost.</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowCancelConfirm(false)} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors">Keep</button>
            <button onClick={cancelSession} className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors">Discard</button>
          </div>
        </div>
      )}
      {restrictedWarning && (
        <div className="px-4 py-2 bg-yellow-950 border-b border-yellow-800 flex items-center justify-between">
          <p className="text-xs text-yellow-300"><strong>{restrictedWarning}</strong> may conflict with your restricted movements. Log with caution.</p>
          <button onClick={() => setRestrictedWarning(null)} className="text-yellow-500 hover:text-yellow-300 text-xs ml-3 shrink-0">✕</button>
        </div>
      )}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className={`bg-zinc-950 rounded-xl border transition-colors ${ex.saved ? "border-green-800" : "border-zinc-800"}`}>
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div><p className="font-medium text-sm">{ex.exerciseName}</p><p className="text-xs text-zinc-500">{ex.muscleGroup}</p></div>
              <div className="flex items-center gap-2">
                {ex.saved && <span className="text-xs text-green-400">✓ saved</span>}
                <button onClick={() => removeExercise(exIdx)} className="text-zinc-600 hover:text-red-400 text-sm transition-colors">✕</button>
              </div>
            </div>
            <div className="px-4 pt-3">
              <div className="grid grid-cols-12 gap-1 text-xs text-zinc-500 mb-2 px-1">
                <span className="col-span-1">SET</span>
                <span className="col-span-4">WEIGHT (lbs)</span>
                <span className="col-span-3">REPS</span>
                <span className="col-span-3">RPE</span>
                <span className="col-span-1"></span>
              </div>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="grid grid-cols-12 gap-1 mb-2 items-center">
                  <span className="col-span-1 text-xs text-zinc-500 text-center">{setIdx + 1}</span>
                  <input type="number" value={set.weightLbs || ""} onChange={(e) => updateSet(exIdx, setIdx, "weightLbs", parseFloat(e.target.value) || 0)} placeholder="0" className="col-span-4 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                  <input type="number" value={set.reps || ""} onChange={(e) => updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)} placeholder="0" className="col-span-3 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                  <input type="number" value={set.rpe || ""} onChange={(e) => updateSet(exIdx, setIdx, "rpe", parseFloat(e.target.value) || 0)} placeholder="—" min="1" max="10" step="0.5" className="col-span-3 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                  <button onClick={() => removeSet(exIdx, setIdx)} className="col-span-1 text-zinc-600 hover:text-red-400 text-xs text-center transition-colors">✕</button>
                </div>
              ))}
            </div>
            <div className="px-4 pb-2">
              <input type="text" value={ex.notes} onChange={(e) => setExercises((prev) => prev.map((e2, i) => i === exIdx ? { ...e2, notes: e.target.value, saved: false } : e2))} placeholder="Notes (optional)" className="w-full bg-transparent text-xs text-zinc-400 placeholder-gray-600 focus:outline-none py-1" />
            </div>
            <div className="px-4 pb-3 flex items-center gap-3">
              <button onClick={() => addSet(exIdx)} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">+ Add Set</button>
              <button onClick={() => saveExercise(exIdx)} disabled={saving} className="ml-auto text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors">{saving ? "Saving..." : "Save Exercise"}</button>
            </div>
          </div>
        ))}
        {!showPresets ? (
          <button onClick={() => setShowPresets(true)} className="w-full border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl py-4 text-zinc-400 hover:text-white text-sm transition-colors">+ Add Exercise</button>
        ) : (
          <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4">
            <div className="flex gap-2 mb-4">
              <input type="text" value={customExercise} onChange={(e) => setCustomExercise(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && customExercise.trim()) addExercise(customExercise.trim(), "Other"); }} placeholder="Type exercise name..." className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" autoFocus />
              <button onClick={() => customExercise.trim() && addExercise(customExercise.trim(), "Other")} className="bg-amber-500 hover:bg-amber-400 text-white text-sm px-4 rounded-lg transition-colors">Add</button>
              <button onClick={() => setShowPresets(false)} className="text-zinc-400 hover:text-white text-sm px-3">✕</button>
            </div>
            {Object.entries(EXERCISE_PRESETS).map(([group, exercises]) => (
              <div key={group} className="mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {exercises.map((name) => (
                    <button key={name} onClick={() => addExercise(name, group)} className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 transition-colors">{name}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}

function TopBar() {
  const router = useRouter();
  return (
    <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between bg-black">
      <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white text-sm">← Dashboard</button>
      <span className="font-semibold text-sm">Workout Log</span>
      <button onClick={() => router.push("/history")} className="text-zinc-400 hover:text-white text-sm">History</button>
    </header>
  );
}
