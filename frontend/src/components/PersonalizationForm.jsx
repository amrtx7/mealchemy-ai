import { useMemo, useState } from "react";

const GOALS = [
  ["maintain_weight", "Maintain weight"],
  ["lose_weight", "Lose weight"],
  ["build_muscle", "Build muscle"],
  ["eat_healthy", "Eat healthy"],
  ["save_money", "Save money"],
  ["quick_meals", "Quick meals"],
];

const DIETS = [
  ["veg", "Vegetarian"],
  ["non-veg", "Non-Vegetarian"],
  ["vegan", "Vegan"],
  ["eggetarian", "Eggetarian"],
  ["no_restriction", "No restriction"],
];

const CUISINES = [
  "North Indian",
  "South Indian",
  "Punjabi",
  "Gujarati",
  "Bengali",
  "Maharashtrian",
  "Chinese",
  "Italian",
  "Mexican",
  "Mediterranean",
  "Fast Food",
];

const BUDGETS = [
  [199, "Under ₹200"],
  [400, "₹200 - ₹400"],
  [700, "₹400 - ₹700"],
  [1000, "₹700 - ₹1000"],
  [1500, "₹1000+"],
];

const ALLERGIES = ["Dairy", "Nuts", "Gluten", "Soy", "None"];

function toggleArray(list, value) {
  if (value === "None") return ["None"];
  const withoutNone = list.filter((item) => item !== "None");
  return withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value];
}

export default function PersonalizationForm({ initialUser, onSubmit, submitLabel = "Save Preferences" }) {
  const [step, setStep] = useState(0);
  const initialPrefs = initialUser?.preferences || {};
  const [form, setForm] = useState({
    name: initialUser?.name || "",
    age: initialPrefs.age || "",
    gender: initialPrefs.gender || "prefer_not_to_say",
    goal: initialPrefs.goal || "eat_healthy",
    diet: initialPrefs.diet || "veg",
    cuisine: initialPrefs.cuisine || [],
    budget: initialPrefs.budget || 400,
    protein: initialPrefs.protein || "moderate",
    cookingTime: initialPrefs.cookingTime || "30min",
    allergies: initialPrefs.allergies?.length ? initialPrefs.allergies : ["None"],
    otherAllergy: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const steps = useMemo(
    () => [
      {
        title: "Tell us who we are cooking for",
        body: (
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="font-black">Full Name</span>
              <input className="input-magic" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="space-y-2">
              <span className="font-black">Age</span>
              <input className="input-magic" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </label>
            <Select label="Gender" value={form.gender} onChange={(gender) => setForm({ ...form, gender })} options={[
              ["male", "Male"],
              ["female", "Female"],
              ["other", "Other"],
              ["prefer_not_to_say", "Prefer not to say"],
            ]} />
          </div>
        ),
      },
      {
        title: "Your food direction",
        body: (
          <div className="space-y-6">
            <OptionGrid label="Primary Goal" value={form.goal} options={GOALS} onChange={(goal) => setForm({ ...form, goal })} />
            <OptionGrid label="Diet Type" value={form.diet} options={DIETS} onChange={(diet) => setForm({ ...form, diet })} />
          </div>
        ),
      },
      {
        title: "Cuisine and budget",
        body: (
          <div className="space-y-6">
            <MultiGrid label="Cuisine Preference" values={form.cuisine} options={CUISINES} onToggle={(cuisine) => setForm({ ...form, cuisine: toggleArray(form.cuisine, cuisine) })} />
            <OptionGrid label="Average Daily Budget" value={form.budget} options={BUDGETS} onChange={(budget) => setForm({ ...form, budget })} />
          </div>
        ),
      },
      {
        title: "Nutrition and cooking style",
        body: (
          <div className="space-y-6">
            <OptionGrid label="Protein Preference" value={form.protein} options={[["high", "High"], ["moderate", "Moderate"], ["low", "Low"]]} onChange={(protein) => setForm({ ...form, protein })} />
            <OptionGrid label="Cooking Time Preference" value={form.cookingTime} options={[["15min", "Under 15 min"], ["30min", "15-30 min"], ["60min", "30-60 min"], ["no_constraint", "No constraint"]]} onChange={(cookingTime) => setForm({ ...form, cookingTime })} />
          </div>
        ),
      },
      {
        title: "Allergies and restrictions",
        body: (
          <div className="space-y-5">
            <MultiGrid label="Allergies / Restrictions" values={form.allergies} options={ALLERGIES} onToggle={(allergy) => setForm({ ...form, allergies: toggleArray(form.allergies, allergy) })} />
            <label className="space-y-2 block">
              <span className="font-black">Other restriction</span>
              <input className="input-magic" value={form.otherAllergy} onChange={(e) => setForm({ ...form, otherAllergy: e.target.value })} placeholder="Optional" />
            </label>
          </div>
        ),
      },
    ],
    [form]
  );

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const allergies = form.otherAllergy
        ? [...form.allergies.filter((item) => item !== "None"), form.otherAllergy]
        : form.allergies;
      await onSubmit({
        ...form,
        age: form.age ? Number(form.age) : null,
        allergies,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="theme-raised border-[4px] border-black rounded-[2rem] p-6 md:p-8 shadow-neo max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="font-black uppercase tracking-[0.25em] theme-accent text-xs">Step {step + 1} of {steps.length}</p>
          <h1 className="text-3xl md:text-5xl font-black mt-2">{steps[step].title}</h1>
        </div>
      </div>
      {steps[step].body}
      {error && <p className="mt-5 font-bold" style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="flex justify-between gap-4 mt-8">
        <button className="btn-secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</button>
        {step < steps.length - 1 ? (
          <button className="btn-primary" onClick={() => setStep((value) => value + 1)}>Next</button>
        ) : (
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return <OptionGrid label={label} value={value} options={options} onChange={onChange} />;
}

function OptionGrid({ label, value, options, onChange }) {
  return (
    <div>
      <p className="font-black mb-3">{label}</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {options.map(([optionValue, labelText]) => (
          <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className={`border-[3px] border-black rounded-xl p-3 font-black text-left shadow-neo-sm ${value === optionValue ? "theme-accent-bg" : "theme-muted"}`}>
            {labelText}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiGrid({ label, values, options, onToggle }) {
  return (
    <div>
      <p className="font-black mb-3">{label}</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onToggle(option)} className={`border-[3px] border-black rounded-xl p-3 font-black text-left shadow-neo-sm ${values.includes(option) ? "theme-accent-bg" : "theme-muted"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
