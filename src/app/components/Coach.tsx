"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type CoachState = "idle" | "loading" | "done" | "error";

export default function Coach() {
  const router = useRouter();
  const [state, setState] = useState<CoachState>("idle");
  const [briefing, setBriefing] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("coach_briefing");
    const cachedTime = sessionStorage.getItem("coach_briefing_time");
    if (cached && cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < 2 * 60 * 60 * 1000) {
        setBriefing(cached);
        setLastRefreshed(new Date(parseInt(cachedTime)));
        setState("done");
        return;
      }
    }
    fetchBriefing();
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [briefing]);

  const fetchBriefing = async () => {
    setState("loading");
    setBriefing("");
    try {
      const res = await fetch("/api/coach");
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setBriefing(full);
      }
      sessionStorage.setItem("coach_briefing", full);
      sessionStorage.setItem("coach_briefing_time", String(Date.now()));
      setLastRefreshed(new Date());
      setState("done");
    } catch (err) {
      console.error(err);
      setState("error");
    }
  };

  const sections = parseSections(briefing);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Daily Coach</span>
          <span className="text-xs text-zinc-500">{today}</span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className={`text-xs ${Date.now() - lastRefreshed.getTime() > 4 * 60 * 60 * 1000 ? "text-yellow-600" : "text-zinc-600"}`}>
              {Date.now() - lastRefreshed.getTime() > 4 * 60 * 60 * 1000 ? "stale — " : ""}{formatTimeAgo(lastRefreshed)}
            </span>
          )}
          <button onClick={fetchBriefing} disabled={state === "loading"} className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-40">
            {state === "loading" ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />Thinking...</span> : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="divide-y divide-zinc-800">
        {state === "loading" && briefing === "" && (
          <div className="px-4 py-6 flex items-center gap-3 text-zinc-400 text-sm">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            Reading your data...
          </div>
        )}
        {state === "error" && <div className="px-4 py-4 text-sm text-red-400">Couldn't load briefing. Check your API key.</div>}
        {sections.length > 0
          ? sections.map((section) => <CoachSection key={section.title} title={section.title} body={section.body} />)
          : briefing && state !== "done" && (
              <div className="px-4 py-3 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {briefing}{state === "loading" && <span className="animate-pulse">▌</span>}
              </div>
            )}
      </div>

      {state === "done" && (
        <div className="px-4 py-3 border-t border-zinc-800 flex gap-2 flex-wrap">
          <ActionChip label="Log Session" onClick={() => router.push("/log")} />
          <ActionChip label="Check In" onClick={() => router.push("/checkin")} />
          <ActionChip label="Nutrition" onClick={() => router.push("/nutrition")} />
        </div>
      )}
    </div>
  );
}

function CoachSection({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {title}
      </p>
      <p className="text-sm text-zinc-200 leading-relaxed">{body}</p>
    </div>
  );
}

function ActionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full transition-colors">
      {label}
    </button>
  );
}

function parseSections(text: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const regex = /\*\*([^*]+)\*\*\n([\s\S]*?)(?=\n\*\*|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    const body = match[2].trim();
    if (title && body) sections.push({ title, body });
  }
  return sections;
}

function formatTimeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
