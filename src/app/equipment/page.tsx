"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_LIST, groupEquipment } from "@/lib/equipment";

const COMMERCIAL_GYM_DEFAULTS = [
  "barbell", "dumbbells", "ez_bar", "kettlebells", "weight_plates",
  "power_rack", "smith_machine", "flat_bench", "incline_bench", "decline_bench",
  "preacher_curl", "landmine", "cable_machine", "cable_crossover",
  "lat_pulldown", "seated_cable_row", "tbar_row", "chest_press_machine",
  "pec_deck", "shoulder_press_machine", "lateral_raise_machine",
  "rear_delt_machine", "row_machine", "bicep_curl_machine",
  "tricep_pushdown_machine", "assisted_pullup",
  "leg_press", "hack_squat", "leg_extension", "leg_curl_lying", "leg_curl_seated",
  "hip_thrust_machine", "adductor_machine", "abductor_machine",
  "standing_calf_raise", "seated_calf_raise",
  "pullup_bar", "dip_bars", "captain_chair", "ab_wheel",
  "treadmill", "stationary_bike", "rowing_machine", "elliptical", "stairmaster",
  "resistance_bands", "dip_belt", "belt", "foam_roller",
  "cable_rope", "straight_bar_cable", "v_bar_cable", "ankle_strap",
];

export default function EquipmentPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const grouped = groupEquipment();
  const categories = Object.keys(grouped);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((profile) => {
      if (profile?.availableEquipment) {
        try {
          const ids: string[] = JSON.parse(profile.availableEquipment);
          setSelected(new Set(ids.length > 0 ? ids : COMMERCIAL_GYM_DEFAULTS));
        } catch { setSelected(new Set(COMMERCIAL_GYM_DEFAULTS)); }
      } else { setSelected(new Set(COMMERCIAL_GYM_DEFAULTS)); }
      setLoading(false);
    });
  }, []);

  const toggle = (id: string) => { setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); setSaved(false); };
  const selectAll = (cat: string) => { setSelected((prev) => { const next = new Set(prev); grouped[cat].forEach((i) => next.add(i.id)); return next; }); setSaved(false); };
  const deselectAll = (cat: string) => { setSelected((prev) => { const next = new Set(prev); grouped[cat].forEach((i) => next.delete(i.id)); return next; }); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ availableEquipment: JSON.stringify(Array.from(selected)) }) });
      setSaved(true);
      setTimeout(() => router.push("/"), 1000);
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const filteredCategories = categories.filter((cat) => grouped[cat].some((item) => search === "" || item.label.toLowerCase().includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 bg-black z-10">
        <button onClick={() => router.push("/")} className="text-zinc-400 hover:text-white text-sm">← Dashboard</button>
        <div className="text-center"><span className="font-semibold text-sm">My Gym Equipment</span><p className="text-xs text-zinc-500">{selected.size} / {EQUIPMENT_LIST.length} selected</p></div>
        <button onClick={handleSave} disabled={saving} className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${saved ? "bg-green-700 text-white" : "bg-amber-500 hover:bg-amber-400 text-white"} disabled:bg-zinc-800`}>{saving ? "Saving..." : saved ? "✓ Saved" : "Save"}</button>
      </header>
      <div className="bg-amber-950 border-b border-amber-900 px-4 py-3 text-xs text-amber-300"><strong>Only selected equipment will be programmed.</strong> Anything unchecked is off limits.</div>
      <div className="px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
        <div className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment..." className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500" />
          <button onClick={() => setSelected(new Set(EQUIPMENT_LIST.map((e) => e.id)))} className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg transition-colors">All</button>
          <button onClick={() => setSelected(new Set())} className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg transition-colors">None</button>
        </div>
        {filteredCategories.map((category) => {
          const items = grouped[category].filter((item) => search === "" || item.label.toLowerCase().includes(search.toLowerCase()) || category.toLowerCase().includes(search.toLowerCase()));
          const selectedInCategory = items.filter((item) => selected.has(item.id)).length;
          const allSelected = selectedInCategory === items.length;
          return (
            <div key={category} className="bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2"><span className="font-medium text-sm">{category}</span><span className="text-xs text-zinc-500">{selectedInCategory}/{items.length}</span></div>
                <button onClick={() => allSelected ? deselectAll(category) : selectAll(category)} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">{allSelected ? "Deselect all" : "Select all"}</button>
              </div>
              <div className="divide-y divide-zinc-800">
                {items.map((item) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <button key={item.id} onClick={() => toggle(item.id)} className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${isSelected ? "bg-gray-850" : "opacity-50"} hover:bg-zinc-900`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-amber-500 border-amber-500" : "border-zinc-600"}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.injuryNote && <span className="text-xs text-yellow-500 ml-2 shrink-0">{item.injuryNote}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <button onClick={handleSave} disabled={saving} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-white font-semibold py-3 rounded-xl transition-colors">{saving ? "Saving..." : saved ? "✓ Saved — Redirecting..." : `Save ${selected.size} Items →`}</button>
        <div className="h-6" />
      </div>
    </div>
  );
}
