"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ExerciseLog = { id: number; exerciseName: string; muscleGroup: string | null; sets: number; reps: number; weightLbs: number; rpe: number | null; notes: string | null };
type Session = { id: number; sessionName: string; date: string; completed: boolean; durationMin: number | null; exercises: ExerciseLog[]; program: { name: string } | null };

function summarizeExercises(logs: ExerciseLog[]) {
  const map: Record<string, { maxWeight: number; totalSets: number; reps: number }> = {};
  for (const log of logs) {
    if (!map[log.exerciseName]) map[log.exerciseName] = { maxWeight: 0, totalSets: 0, reps: log.reps };
    map[log.exerciseName].maxWeight = Math.max(map[log.exerciseName].maxWeight, log.weightLbs);
    map[log.exerciseName].totalSets += 1;
  }
  return map;
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [view, setView] = useState<"sessions" | "progression">("sessions");
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    fetch("/api/sessions?limit=30").then((r) => r.json()).then((data) => { setSessions(data); setLoading(false); });
  }, []);

  const allExerciseNames = Array.from(new Set(sessions.flatMap((s) => s.exercises.map((e) => e.exerciseName)))).sort();

  const progressionData = selectedExercise
    ? sessions.filter((s) => s.exercises.some((e) => e.exerciseName === selectedExercise)).map((s) => {
        const logs = s.exercises.filter((e) => e.exerciseName === selectedExercise);
        return { date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), maxWeight: Math.max(...logs.map((l) => l.weightLbs)), totalReps: logs.reduce((sum, l) => sum + l.reps, 0), sets: logs.length };
      }).reverse()
    : [];

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
        <span className="font-semibold text-sm">History</span>
        <button onClick={() => router.push("/log")} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">+ Log Session</button>
      </header>
      <div className="flex border-b border-gray-800">
        {(["sessions", "progression"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${view === v ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}>{v}</button>
        ))}
      </div>
      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {view === "sessions" && (
          sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-400 mb-4">No sessions logged yet.</p>
              <button onClick={() => router.push("/log")} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">Log Your First Session</button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const summary = summarizeExercises(session.exercises);
                const isExpanded = expanded === session.id;
                return (
                  <div key={session.id} className="bg-gray-900 rounded-xl border border-gray-800">
                    <button onClick={() => setExpanded(isExpanded ? null : session.id)} className="w-full px-4 py-3 flex items-center justify-between text-left">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{session.sessionName}</span>
                          {session.completed && <span className="text-xs text-green-400 bg-green-950 border border-green-800 px-1.5 py-0.5 rounded-full">✓</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{session.durationMin && ` · ${session.durationMin}min`}{session.program && ` · ${session.program.name}`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{Object.keys(summary).length} exercises</span>
                        <span className="text-gray-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-800 px-4 py-3 space-y-2">
                        {Object.entries(summary).map(([name, stats]) => (
                          <div key={name} className="flex items-center justify-between">
                            <div><p className="text-sm">{name}</p><p className="text-xs text-gray-500">{stats.totalSets} sets × {stats.reps} reps</p></div>
                            <span className="text-sm font-mono font-medium">{stats.maxWeight}<span className="text-xs text-gray-400 ml-0.5">lbs</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
        {view === "progression" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-2">Select a lift to track</label>
              <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Choose an exercise...</option>
                {allExerciseNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            {selectedExercise && progressionData.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="font-medium mb-4">{selectedExercise}</h3>
                <div className="space-y-2">
                  {progressionData.map((entry, i) => {
                    const maxW = Math.max(...progressionData.map((d) => d.maxWeight));
                    const barWidth = maxW > 0 ? (entry.maxWeight / maxW) * 100 : 0;
                    const delta = i > 0 ? entry.maxWeight - progressionData[i - 1].maxWeight : null;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16 shrink-0">{entry.date}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${barWidth}%` }} /></div>
                        <span className="text-xs font-mono w-16 text-right">{entry.maxWeight}lbs</span>
                        {delta !== null && <span className={`text-xs w-10 text-right ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-gray-500"}`}>{delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-800">
                  <Stat label="Best" value={`${Math.max(...progressionData.map((d) => d.maxWeight))}lbs`} />
                  <Stat label="Sessions" value={String(progressionData.length)} />
                  <Stat label="Total gain" value={progressionData.length > 1 ? `${progressionData[progressionData.length - 1].maxWeight - progressionData[0].maxWeight > 0 ? "+" : ""}${progressionData[progressionData.length - 1].maxWeight - progressionData[0].maxWeight}lbs` : "—"} />
                </div>
              </div>
            )}
            {selectedExercise && progressionData.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No data for {selectedExercise} yet.</p>}
            {!selectedExercise && <p className="text-gray-500 text-sm text-center py-8">Select a lift above to see your progression over time.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="text-center"><p className="text-lg font-bold">{value}</p><p className="text-xs text-gray-400">{label}</p></div>;
}
