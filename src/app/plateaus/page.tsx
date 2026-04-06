"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Plateau = {
  id: number;
  exerciseName: string;
  stalledWeeks: number;
  lastWeight: number;
  detectedAt: string;
  aiAnalysis: string | null;
  resolved: boolean;
};

export default function PlateausPage() {
  const router = useRouter();
  const [plateaus, setPlateaus] = useState<Plateau[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [resolveNotes, setResolveNotes] = useState<Record<number, string>>({});
  const [showResolveFor, setShowResolveFor] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/plateaus").then((r) => r.json()).then((data) => { setPlateaus(data); setLoading(false); });
  }, []);

  const resolvePlateau = async (id: number) => {
    setResolving(id);
    try {
      await fetch(`/api/plateaus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true, resolvedNotes: resolveNotes[id] ?? "" }),
      });
      setPlateaus((prev) => prev.filter((p) => p.id !== id));
      setShowResolveFor(null);
    } catch (err) { console.error(err); } finally { setResolving(null); }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
        <span className="font-semibold text-sm">Plateaus</span>
        <div className="w-16" />
      </header>

      <div className="px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
        {plateaus.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-4xl mb-4">✓</p>
            <p className="text-gray-300 font-medium">No active plateaus</p>
            <p className="text-gray-500 text-sm mt-1">Keep logging sessions — plateaus are detected automatically from check-ins.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500">{plateaus.length} unresolved plateau{plateaus.length > 1 ? "s" : ""} detected from your check-in history.</p>
            {plateaus.map((p) => (
              <div key={p.id} className="bg-gray-900 rounded-xl border border-orange-900">
                <div className="px-4 py-4 border-b border-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.exerciseName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Stalled for {p.stalledWeeks} week{p.stalledWeeks > 1 ? "s" : ""} · Last weight: <span className="text-white font-mono">{p.lastWeight}lbs</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">Detected {new Date(p.detectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <span className="text-xs bg-orange-900 border border-orange-700 text-orange-300 px-2 py-0.5 rounded-full shrink-0">plateau</span>
                  </div>
                </div>

                {p.aiAnalysis && (
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">AI Analysis</p>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{p.aiAnalysis}</p>
                  </div>
                )}

                <div className="px-4 py-3">
                  {showResolveFor === p.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={resolveNotes[p.id] ?? ""}
                        onChange={(e) => setResolveNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="How did you break through it? (optional)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowResolveFor(null)} className="flex-1 text-xs text-gray-400 hover:text-white border border-gray-700 py-2 rounded-lg transition-colors">Cancel</button>
                        <button onClick={() => resolvePlateau(p.id)} disabled={resolving === p.id} className="flex-1 text-xs bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors">
                          {resolving === p.id ? "Resolving..." : "Mark Resolved ✓"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowResolveFor(p.id)} className="w-full text-xs text-green-400 hover:text-green-300 border border-green-900 hover:border-green-700 py-2 rounded-lg transition-colors">
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
