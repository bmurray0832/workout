"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type DailyLog = {
  id: number;
  date: string;
  weightLbs: number | null;
  sleepHours: number | null;
  waterOz: number | null;
  mood: number | null;
  energy: number | null;
  steps: number | null;
  notes: string | null;
};

const INPUT =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500";

const MOOD_LABELS = ["", "Awful", "Bad", "Okay", "Good", "Great"];
const MOOD_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
const ENERGY_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"];

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function DailyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"log" | "trends">("log");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    weightLbs: "",
    sleepHours: "",
    waterOz: "",
    mood: 0,
    energy: 0,
    steps: "",
    notes: "",
  });
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [range, setRange] = useState(14);
  const [isEdit, setIsEdit] = useState(false);

  // Load today's entry if exists
  useEffect(() => {
    fetch(`/api/daily?limit=1`)
      .then((r) => r.json())
      .then((data: DailyLog[]) => {
        if (data.length > 0 && data[0].date === today()) {
          const d = data[0];
          setForm({
            weightLbs: d.weightLbs ? String(d.weightLbs) : "",
            sleepHours: d.sleepHours ? String(d.sleepHours) : "",
            waterOz: d.waterOz ? String(d.waterOz) : "",
            mood: d.mood ?? 0,
            energy: d.energy ?? 0,
            steps: d.steps ? String(d.steps) : "",
            notes: d.notes ?? "",
          });
          setIsEdit(true);
        }
      });
  }, []);

  // Load trend data
  useEffect(() => {
    const from = daysAgo(range);
    const to = today();
    fetch(`/api/daily?from=${from}&to=${to}&limit=${range + 1}`)
      .then((r) => r.json())
      .then((data: DailyLog[]) => setLogs(data.reverse()));
  }, [range, saved]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today(),
          weightLbs: form.weightLbs ? parseFloat(form.weightLbs) : null,
          sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : null,
          waterOz: form.waterOz ? parseInt(form.waterOz) : null,
          mood: form.mood || null,
          energy: form.energy || null,
          steps: form.steps ? parseInt(form.steps) : null,
          notes: form.notes || null,
        }),
      });
      setSaved(true);
      setIsEdit(true);
      setTab("trends");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm">
          ← Dashboard
        </button>
        <span className="font-semibold text-sm">Daily Health Log</span>
        <span className="text-xs text-gray-500">{shortDate(today())}</span>
      </header>

      {saved && (
        <div className="bg-green-950 border-b border-green-800 px-4 py-2 text-xs text-center text-green-300">
          Saved! Viewing your trends below.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        {(["log", "trends"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "log" ? (isEdit ? "Edit Today" : "Log Today") : "Trends"}
          </button>
        ))}
      </div>

      {tab === "log" ? (
        <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
          <Section title="Body">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.weightLbs}
                  onChange={(e) => setForm((p) => ({ ...p, weightLbs: e.target.value }))}
                  placeholder="185"
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300">Sleep (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.sleepHours}
                  onChange={(e) => setForm((p) => ({ ...p, sleepHours: e.target.value }))}
                  placeholder="7.5"
                  className={INPUT}
                />
              </div>
            </div>
          </Section>

          <Section title="Wellness">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-2">Mood</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, mood: v }))}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        form.mood === v
                          ? "text-white border-transparent scale-105"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                      style={form.mood === v ? { backgroundColor: MOOD_COLORS[v] + "33", borderColor: MOOD_COLORS[v] } : {}}
                    >
                      {MOOD_LABELS[v]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-300 mb-2">Energy</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, energy: v }))}
                      className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all ${
                        form.energy === v
                          ? "text-white border-transparent"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                      style={form.energy === v ? { backgroundColor: ENERGY_COLORS[v] + "33", borderColor: ENERGY_COLORS[v] } : {}}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">Drained</span>
                  <span className="text-xs text-gray-600">Wired</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Activity & Hydration">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300">Water (oz)</label>
                <input
                  type="number"
                  value={form.waterOz}
                  onChange={(e) => setForm((p) => ({ ...p, waterOz: e.target.value }))}
                  placeholder="64"
                  className={INPUT}
                />
                <div className="flex gap-1 mt-1">
                  {[8, 16, 24].map((oz) => (
                    <button
                      key={oz}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          waterOz: String((parseInt(p.waterOz) || 0) + oz),
                        }))
                      }
                      className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded hover:border-sky-600 hover:text-sky-400 transition-colors"
                    >
                      +{oz}oz
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300">Steps</label>
                <input
                  type="number"
                  value={form.steps}
                  onChange={(e) => setForm((p) => ({ ...p, steps: e.target.value }))}
                  placeholder="8000"
                  className={INPUT}
                />
              </div>
            </div>
          </Section>

          <Section title="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="How are you feeling today?"
              rows={2}
              className={`${INPUT} resize-none`}
            />
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update Today's Log →" : "Save Today's Log →"}
          </button>
          <div className="h-6" />
        </form>
      ) : (
        <div className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
          {/* Range selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">Your Trends</h2>
            <div className="flex gap-1">
              {[7, 14, 30].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    range === r
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-500 text-sm">No data yet. Log your first day to see trends!</p>
            </div>
          ) : (
            <>
              <WeightChart logs={logs} />
              <SleepChart logs={logs} />
              <WaterChart logs={logs} />
              <MoodEnergyChart logs={logs} />
            </>
          )}
          <div className="h-6" />
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ── SVG Chart Helpers ──
const W = 560;
const H = 180;
const PAD = { top: 20, right: 20, bottom: 30, left: 45 };

function sx(i: number, total: number) {
  if (total <= 1) return PAD.left + (W - PAD.left - PAD.right) / 2;
  return PAD.left + (i / (total - 1)) * (W - PAD.left - PAD.right);
}

function sy(val: number, min: number, max: number) {
  const range = max - min || 1;
  return H - PAD.bottom - ((val - min) / range) * (H - PAD.top - PAD.bottom);
}

function GridLines({ min, max, count = 4, format }: { min: number; max: number; count?: number; format?: (v: number) => string }) {
  const range = max - min || 1;
  const step = range / (count - 1);
  const lines = Array.from({ length: count }, (_, i) => min + step * i);
  return (
    <>
      {lines.map((v) => {
        const y = sy(v, min, max);
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1f2937" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">
              {format ? format(v) : Math.round(v)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function XLabels({ logs, maxLabels = 10 }: { logs: DailyLog[]; maxLabels?: number }) {
  const step = Math.max(1, Math.ceil(logs.length / maxLabels));
  return (
    <>
      {logs.map((l, i) =>
        i % step === 0 ? (
          <text key={l.date} x={sx(i, logs.length)} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">
            {shortDate(l.date)}
          </text>
        ) : null
      )}
    </>
  );
}

// ── Weight Line Chart ──
function WeightChart({ logs }: { logs: DailyLog[] }) {
  const data = logs.filter((l) => l.weightLbs !== null) as (DailyLog & { weightLbs: number })[];
  if (data.length < 2) {
    return (
      <Section title="Weight">
        <p className="text-gray-500 text-sm text-center py-6">Need at least 2 entries to show trend</p>
      </Section>
    );
  }
  const vals = data.map((d) => d.weightLbs);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const points = data.map((d, i) => `${sx(i, data.length)},${sy(d.weightLbs, min, max)}`).join(" ");
  const areaPoints = `${sx(0, data.length)},${H - PAD.bottom} ${points} ${sx(data.length - 1, data.length)},${H - PAD.bottom}`;
  const diff = vals[vals.length - 1] - vals[0];
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);

  return (
    <Section title="Weight Trend">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-lg font-bold">{vals[vals.length - 1]} lbs</span>
        <span className={`text-xs font-medium ${diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-gray-400"}`}>
          {diffStr} lbs over period
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <GridLines min={min} max={max} />
        <polygon points={areaPoints} fill="url(#weightGrad)" />
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={d.date} cx={sx(i, data.length)} cy={sy(d.weightLbs, min, max)} r="4" fill="#3b82f6" stroke="#1e3a5f" strokeWidth="2" />
        ))}
        <XLabels logs={data} />
      </svg>
    </Section>
  );
}

// ── Sleep Bar Chart ──
function SleepChart({ logs }: { logs: DailyLog[] }) {
  const data = logs.filter((l) => l.sleepHours !== null) as (DailyLog & { sleepHours: number })[];
  if (data.length === 0) return null;
  const max = Math.max(10, ...data.map((d) => d.sleepHours));
  const barW = Math.max(8, Math.min(24, (W - PAD.left - PAD.right) / data.length - 4));

  return (
    <Section title="Sleep">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-lg font-bold">{data[data.length - 1].sleepHours}h</span>
        <span className="text-xs text-gray-400">
          avg {(data.reduce((s, d) => s + d.sleepHours, 0) / data.length).toFixed(1)}h
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <GridLines min={0} max={max} format={(v) => `${v}h`} />
        {data.map((d, i) => {
          const x = sx(i, data.length) - barW / 2;
          const barH = ((d.sleepHours / max) * (H - PAD.top - PAD.bottom));
          const y = H - PAD.bottom - barH;
          const color = d.sleepHours < 6 ? "#ef4444" : d.sleepHours < 7 ? "#f59e0b" : "#22c55e";
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={color} opacity="0.8" />
              <text x={sx(i, data.length)} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">
                {shortDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </Section>
  );
}

// ── Water Intake Chart ──
function WaterChart({ logs }: { logs: DailyLog[] }) {
  const data = logs.filter((l) => l.waterOz !== null) as (DailyLog & { waterOz: number })[];
  if (data.length === 0) return null;
  const goal = 64;
  const max = Math.max(goal + 16, ...data.map((d) => d.waterOz));
  const barW = Math.max(8, Math.min(24, (W - PAD.left - PAD.right) / data.length - 4));

  return (
    <Section title="Water Intake">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-lg font-bold">{data[data.length - 1].waterOz} oz</span>
        <span className="text-xs text-gray-400">goal: {goal}oz</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <GridLines min={0} max={max} format={(v) => `${v}`} />
        {/* Goal line */}
        <line
          x1={PAD.left}
          y1={sy(goal, 0, max)}
          x2={W - PAD.right}
          y2={sy(goal, 0, max)}
          stroke="#38bdf8"
          strokeWidth="1"
          strokeDasharray="6 3"
          opacity="0.5"
        />
        {data.map((d, i) => {
          const x = sx(i, data.length) - barW / 2;
          const barH = (d.waterOz / max) * (H - PAD.top - PAD.bottom);
          const y = H - PAD.bottom - barH;
          const hit = d.waterOz >= goal;
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={hit ? "#38bdf8" : "#64748b"} opacity={hit ? 0.8 : 0.5} />
              <text x={sx(i, data.length)} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">
                {shortDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </Section>
  );
}

// ── Mood & Energy Dot Plot ──
function MoodEnergyChart({ logs }: { logs: DailyLog[] }) {
  const hasMood = logs.some((l) => l.mood !== null);
  const hasEnergy = logs.some((l) => l.energy !== null);
  if (!hasMood && !hasEnergy) return null;

  const min = 0.5;
  const max = 5.5;

  return (
    <Section title="Mood & Energy">
      <div className="flex gap-4 mb-2">
        {hasMood && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            <span className="text-xs text-gray-400">Mood</span>
          </div>
        )}
        {hasEnergy && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-gray-400">Energy</span>
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <GridLines min={min} max={max} count={5} format={(v) => `${Math.round(v)}`} />
        {/* Mood line + dots */}
        {hasMood && (
          <>
            <polyline
              points={logs
                .map((l, i) => (l.mood !== null ? `${sx(i, logs.length)},${sy(l.mood, min, max)}` : null))
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity="0.7"
            />
            {logs.map((l, i) =>
              l.mood !== null ? (
                <circle key={`m-${l.date}`} cx={sx(i, logs.length)} cy={sy(l.mood, min, max)} r="4" fill="#a78bfa" stroke="#4c1d95" strokeWidth="1.5" />
              ) : null
            )}
          </>
        )}
        {/* Energy line + dots */}
        {hasEnergy && (
          <>
            <polyline
              points={logs
                .map((l, i) => (l.energy !== null ? `${sx(i, logs.length)},${sy(l.energy, min, max)}` : null))
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity="0.7"
            />
            {logs.map((l, i) =>
              l.energy !== null ? (
                <circle key={`e-${l.date}`} cx={sx(i, logs.length)} cy={sy(l.energy, min, max)} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
              ) : null
            )}
          </>
        )}
        <XLabels logs={logs} />
      </svg>
    </Section>
  );
}
