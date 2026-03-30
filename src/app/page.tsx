"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PromptType } from "./api/generate/route";
import Coach from "./components/Coach";

type Profile = {
  name: string;
  weightLbs: number;
  age: number;
  primaryGoal: string;
  injuryNotes: string | null;
};

type CheckInSummary = {
  daysAgo: number;
  bodyweightLbs: number;
  energyScore: number;
  recoveryScore: number;
};

type Program = {
  id: number;
  name: string;
  weeks: number;
  content: string;
  startDate: string | null;
  createdAt: string;
};

const TOOLS: { type: PromptType; label: string; description: string; icon: string }[] = [
  { type: "program", label: "Generate Program", description: "12-week periodized plan", icon: "⛹️" },
  { type: "plateau", label: "Fix a Plateau", description: "8-week breakthrough plan", icon: "📈" },
  { type: "weakpoint", label: "Weak Point Diagnosis", description: "Find and fix the gaps", icon: "🎯" },
  { type: "recovery", label: "Recovery Protocol", description: "Sleep, mobility, deloads", icon: "😴" },
  { type: "injury", label: "Injury Prevention", description: "Prehab & movement quality", icon: "🛡️" },
  { type: "tracker", label: "Progress Analysis", description: "Data-driven adjustments", icon: "📊" },
  { type: "recomp", label: "Recomp Strategy", description: "Build muscle, lose fat", icon: "⚡" },
];

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeType, setActiveType] = useState<PromptType | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const [checkIn, setCheckIn] = useState<CheckInSummary | null>(null);
  const [plateauCount, setPlateauCount] = useState(0);
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/program/active").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/checkin?limit=1").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/plateaus").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/nutrition/plan/active").then((r) => (r.ok ? r.json() : null)),
    ]).then(([p, prog, checkIns, plateaus, mealPlan]) => {
      setProfile(p);
      setProgram(prog);
      setPlateauCount(plateaus?.length ?? 0);
      setHasMealPlan(!!mealPlan);
      if (checkIns?.length > 0) {
        const last = checkIns[0];
        const daysAgo = Math.floor((Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24));
        setCheckIn({ daysAgo, bodyweightLbs: last.bodyweightLbs, energyScore: last.energyScore, recoveryScore: last.recoveryScore });
      }
      setLoading(false);
      if (!p) router.push("/onboarding");
    });
  }, [router]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [streamedContent]);

  const handleGenerate = async (type: PromptType) => {
    setGenerating(true);
    setActiveType(type);
    setStreamedContent("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStreamedContent((prev) => prev + decoder.decode(value));
      }
      if (type === "program" || type === "recomp") {
        const updated = await fetch("/api/program/active").then((r) => r.json());
        setProgram(updated);
      }
    } catch (err) {
      console.error(err);
      setStreamedContent("Error generating. Check your API key in .env.local.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">FitAI</h1>
          {profile && (
            <p className="text-xs text-gray-400">
              {profile.name} · {profile.weightLbs}lbs · {profile.age}yo · Goal: {profile.primaryGoal}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/history")} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">History</button>
          <button onClick={() => router.push("/nutrition")} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">🥗 Nutrition</button>
          {hasMealPlan && <button onClick={() => router.push("/nutrition/plan")} className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-3 py-1.5 rounded-lg transition-colors">Meal Plan</button>}
          <button onClick={() => router.push("/equipment")} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">⛹️ Equipment</button>
          <button
            onClick={() => router.push("/checkin")}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${
              checkIn === null || checkIn.daysAgo >= 7
                ? "bg-orange-600 hover:bg-orange-500 text-white border-orange-500"
                : "text-gray-400 hover:text-white border-gray-700"
            }`}
          >
            {checkIn === null ? "Check In" : checkIn.daysAgo === 0 ? "✓ Checked In" : `Check In (${checkIn.daysAgo}d ago)`}
          </button>
          <button onClick={() => router.push("/log")} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">+ Log Session</button>
          <button onClick={() => router.push("/onboarding")} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">Profile</button>
        </div>
      </header>

      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-4 overflow-x-auto">
        {checkIn ? (
          <>
            <StatusChip label="Weight" value={`${checkIn.bodyweightLbs}lbs`} sub={checkIn.daysAgo === 0 ? "today" : `${checkIn.daysAgo}d ago`} />
            <StatusChip label="Energy" value={`${checkIn.energyScore}/10`} />
            <StatusChip label="Recovery" value={`${checkIn.recoveryScore}/10`} />
          </>
        ) : (
          <p className="text-xs text-gray-500">No check-ins yet — <button onClick={() => router.push("/checkin")} className="text-blue-400 hover:underline">log your first one</button></p>
        )}
        {plateauCount > 0 && (
          <button onClick={() => handleGenerate("plateau")} className="ml-auto shrink-0 text-xs bg-orange-900 border border-orange-700 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-800 transition-colors">
            ⚠️ {plateauCount} plateau{plateauCount > 1 ? "s" : ""} detected — fix it
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">AI Tools</h2>
          {TOOLS.map((tool) => (
            <button
              key={tool.type}
              onClick={() => handleGenerate(tool.type)}
              disabled={generating}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeType === tool.type ? "border-blue-500 bg-blue-950" : "border-gray-800 bg-gray-900 hover:border-gray-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <div className="text-sm font-medium">{tool.label}</div>
                  <div className="text-xs text-gray-400">{tool.description}</div>
                </div>
              </div>
            </button>
          ))}
          {profile?.injuryNotes && (
            <div className="mt-4 p-3 bg-yellow-950 border border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-300 font-medium">⚠️ Injury on file</p>
              <p className="text-xs text-yellow-400 mt-1">{profile.injuryNotes}</p>
              <p className="text-xs text-yellow-500 mt-1">All prompts are injury-aware.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Coach />
          {streamedContent ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                <span className="text-sm font-medium">
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      Generating...
                    </span>
                  ) : (
                    `✓ ${TOOLS.find((t) => t.type === activeType)?.label ?? "Response"}`
                  )}
                </span>
                {!generating && (
                  <button onClick={() => navigator.clipboard.writeText(streamedContent)} className="text-xs text-gray-400 hover:text-white">Copy</button>
                )}
              </div>
              <div ref={contentRef} className="p-5 max-h-[600px] overflow-y-auto text-sm text-gray-200 whitespace-pre-wrap leading-relaxed font-mono">
                {streamedContent}
                {generating && <span className="animate-pulse">▌</span>}
              </div>
            </div>
          ) : program ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="font-semibold">{program.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {program.weeks} weeks · {program.startDate ? `Started ${new Date(program.startDate).toLocaleDateString()}` : "Not started"}
                </p>
              </div>
              <div className="p-5 max-h-[600px] overflow-y-auto text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{program.content}</div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl h-64 flex flex-col items-center justify-center text-center p-8">
              <p className="text-gray-400 text-sm mb-4">No program generated yet.</p>
              <button onClick={() => handleGenerate("program")} disabled={generating} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                ⛹️ Generate My 12-Week Program
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-white">{value}</span>
      {sub && <span className="text-xs text-gray-600">{sub}</span>}
    </div>
  );
}
