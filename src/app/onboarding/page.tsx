"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = Record<string, unknown>;

function Field({ label, name, type = "text", placeholder = "", form, onChange }: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  form: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        value={String(form[name] ?? "")}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
      />
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

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    weightLbs: "" as number | string,
    heightStr: "",
    age: "" as number | string,
    sex: "male",
    benchMaxLbs: "" as number | string,
    squatMaxLbs: "" as number | string,
    deadliftMaxLbs: "" as number | string,
    ohpMaxLbs: "" as number | string,
    legPressMaxLbs: "" as number | string,
    tbarRowWeightLbs: "" as number | string,
    trainingDaysPerWeek: 4 as number | string,
    sessionLengthMin: 60 as number | string,
    equipment: "commercial gym",
    primaryGoal: "hypertrophy",
    secondaryGoal: "strength",
    injuryNotes: "",
    restrictedMovements: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weightLbs: parseFloat(String(form.weightLbs)),
          age: parseInt(String(form.age)),
          benchMaxLbs: form.benchMaxLbs ? parseFloat(String(form.benchMaxLbs)) : null,
          squatMaxLbs: form.squatMaxLbs ? parseFloat(String(form.squatMaxLbs)) : null,
          deadliftMaxLbs: form.deadliftMaxLbs ? parseFloat(String(form.deadliftMaxLbs)) : null,
          ohpMaxLbs: form.ohpMaxLbs ? parseFloat(String(form.ohpMaxLbs)) : null,
          legPressMaxLbs: form.legPressMaxLbs ? parseFloat(String(form.legPressMaxLbs)) : null,
          tbarRowWeightLbs: form.tbarRowWeightLbs ? parseFloat(String(form.tbarRowWeightLbs)) : null,
          trainingDaysPerWeek: parseInt(String(form.trainingDaysPerWeek)),
          sessionLengthMin: parseInt(String(form.sessionLengthMin)),
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      router.push("/");
    } catch (err) {
      setError("Something went wrong. Check the console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const f = form as FormData;

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Set Up Your Profile</h1>
          <p className="text-gray-400">This gets filled in once. Every prompt auto-populates from here.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Personal">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" name="name" form={f} onChange={handleChange} />
              <Field label="Age" name="age" type="number" form={f} onChange={handleChange} />
              <Field label="Weight (lbs)" name="weightLbs" type="number" form={f} onChange={handleChange} />
              <Field label="Height" name="heightStr" placeholder="6'1.5&quot;" form={f} onChange={handleChange} />
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-300">Sex</label>
              <select name="sex" value={form.sex} onChange={handleChange} className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </Section>
          <Section title="Estimated 1RMs (lbs)">
            <p className="text-xs text-gray-500 mb-3">Leave blank if unknown. These update automatically as you log workouts.</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bench Press" name="benchMaxLbs" type="number" placeholder="176" form={f} onChange={handleChange} />
              <Field label="Squat" name="squatMaxLbs" type="number" placeholder="Leave blank if injured" form={f} onChange={handleChange} />
              <Field label="Deadlift" name="deadliftMaxLbs" type="number" placeholder="225" form={f} onChange={handleChange} />
              <Field label="Overhead Press" name="ohpMaxLbs" type="number" placeholder="100" form={f} onChange={handleChange} />
              <Field label="Leg Press (working weight)" name="legPressMaxLbs" type="number" placeholder="360" form={f} onChange={handleChange} />
              <Field label="T-Bar Row (weight per side)" name="tbarRowWeightLbs" type="number" placeholder="90" form={f} onChange={handleChange} />
            </div>
          </Section>
          <Section title="Training Setup">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Days per week" name="trainingDaysPerWeek" type="number" form={f} onChange={handleChange} />
              <Field label="Max session length (min)" name="sessionLengthMin" type="number" form={f} onChange={handleChange} />
              <Field label="Equipment" name="equipment" placeholder="commercial gym" form={f} onChange={handleChange} />
              <Field label="Primary Goal" name="primaryGoal" placeholder="hypertrophy" form={f} onChange={handleChange} />
              <Field label="Secondary Goal" name="secondaryGoal" placeholder="strength" form={f} onChange={handleChange} />
            </div>
          </Section>
          <Section title="Injury Notes">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Injury description</label>
                <textarea name="injuryNotes" value={form.injuryNotes} onChange={handleChange} rows={2} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Restricted movements</label>
                <textarea name="restrictedMovements" value={form.restrictedMovements} onChange={handleChange} rows={2} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
          </Section>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors">
            {loading ? "Saving..." : "Save Profile & Go to Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
