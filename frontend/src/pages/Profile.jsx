import { useMemo, useState } from "react";
import History from "./History";
import { useAuth } from "../context/AuthContext";

const GOAL_LABELS = {
  maintain_weight: "Maintain weight",
  lose_weight: "Lose weight",
  build_muscle: "Build muscle",
  eat_healthy: "Eat healthy",
  save_money: "Save money",
  quick_meals: "Quick meals",
};

const DIET_LABELS = {
  veg: "Vegetarian",
  "non-veg": "Non-Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  no_restriction: "No restriction",
};

const PROTEIN_LABELS = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

const COOKING_TIME_LABELS = {
  "15min": "Under 15 min",
  "30min": "15-30 min",
  "60min": "30-60 min",
  no_constraint: "No constraint",
};

const GENDER_LABELS = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const BUDGET_OPTIONS = [
  [199, "Under ₹200"],
  [400, "₹200 - ₹400"],
  [700, "₹400 - ₹700"],
  [1000, "₹700 - ₹1000"],
  [1500, "₹1000+"],
];

const GOAL_OPTIONS = Object.entries(GOAL_LABELS);
const DIET_OPTIONS = Object.entries(DIET_LABELS);
const PROTEIN_OPTIONS = Object.entries(PROTEIN_LABELS);
const COOKING_OPTIONS = Object.entries(COOKING_TIME_LABELS);
const GENDER_OPTIONS = Object.entries(GENDER_LABELS);
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
const ALLERGIES = ["Dairy", "Nuts", "Gluten", "Soy", "None"];

function toggleArray(list, value) {
  if (value === "None") return ["None"];
  const withoutNone = list.filter((item) => item !== "None");
  return withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value];
}

function prettyBudget(value) {
  const match = BUDGET_OPTIONS.find(([amount]) => Number(amount) === Number(value));
  return match ? match[1] : value ? `₹${value}` : "Not set";
}

function Stat({ label, value }) {
  return (
    <div className="theme-muted rounded-2xl border-[3px] border-black p-4">
      <p className="text-xs uppercase tracking-[0.2em] theme-muted-text font-black">{label}</p>
      <p className="text-2xl font-black mt-2">{value || "Not set"}</p>
    </div>
  );
}

function PreferenceRow({ label, value }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 py-4 border-t-[3px] border-black first:border-t-0">
      <div className="w-full md:w-56 shrink-0 text-sm uppercase tracking-[0.2em] font-black theme-muted-text">
        {label}
      </div>
      <div className="font-black text-lg">{value || "Not set"}</div>
    </div>
  );
}

export default function Profile() {
  const { user, savePreferences } = useAuth();
  const prefs = user?.preferences || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    age: prefs.age || "",
    height: prefs.height || "",
    weight: prefs.weight || "",
    gender: prefs.gender || "prefer_not_to_say",
    goal: prefs.goal || "eat_healthy",
    diet: prefs.diet || "veg",
    cuisine: prefs.cuisine || [],
    budget: prefs.budget || 400,
    protein: prefs.protein || "moderate",
    cookingTime: prefs.cookingTime || "30min",
    allergies: prefs.allergies?.length ? prefs.allergies : ["None"],
  });

  const avatar = useMemo(() => (user?.name?.trim()?.[0] || "U").toUpperCase(), [user?.name]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await savePreferences({
        ...form,
        age: form.age ? Number(form.age) : null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
      });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayValues = {
    goal: GOAL_LABELS[prefs.goal] || "Not set",
    diet: DIET_LABELS[prefs.diet] || "Not set",
    budget: prettyBudget(prefs.budget),
    protein: PROTEIN_LABELS[prefs.protein] || "Not set",
    cookingTime: COOKING_TIME_LABELS[prefs.cookingTime] || "Not set",
    gender: GENDER_LABELS[prefs.gender] || "Not set",
    cuisine: prefs.cuisine?.length ? prefs.cuisine.join(", ") : "Not set",
    allergies: prefs.allergies?.length ? prefs.allergies.join(", ") : "None",
  };

  return (
    <section className="max-w-6xl mx-auto my-10 px-6 space-y-10">
      <div className="theme-raised rounded-[2rem] border-[4px] border-black p-6 md:p-8 shadow-neo">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-[1.75rem] border-[4px] border-black theme-accent-bg flex items-center justify-center text-4xl font-black shadow-neo-sm">
              {avatar}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-black theme-accent">Profile</p>
              <h1 className="text-4xl md:text-5xl font-black mt-2">{user?.name || "Your Profile"}</h1>
              <p className="theme-muted-text mt-2">
                Your saved defaults for meal personalization and planning.
              </p>
            </div>
          </div>

          {!editing ? (
            <button className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          ) : (
            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <Stat label="Age" value={prefs.age ? `${prefs.age}` : "Not set"} />
          <Stat label="Height" value={prefs.height ? `${prefs.height} cm` : "Add height"} />
          <Stat label="Weight" value={prefs.weight ? `${prefs.weight} kg` : "Add weight"} />
          <Stat label="Gender" value={displayValues.gender} />
        </div>
      </div>

      <div className="theme-raised rounded-[2rem] border-[4px] border-black p-6 md:p-8 shadow-neo">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-black theme-accent">Preferences</p>
            <h2 className="text-3xl md:text-4xl font-black mt-2">
              {editing ? "Edit your defaults" : "Your selected defaults"}
            </h2>
          </div>
        </div>

        {editing ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input className="input-magic" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Age">
                <input className="input-magic" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </Field>
              <Field label="Height (cm)">
                <input className="input-magic" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </Field>
              <Field label="Weight (kg)">
                <input className="input-magic" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </Field>
            </div>

            <EditGrid label="Gender" value={form.gender} options={GENDER_OPTIONS} onChange={(gender) => setForm({ ...form, gender })} />
            <EditGrid label="Primary Goal" value={form.goal} options={GOAL_OPTIONS} onChange={(goal) => setForm({ ...form, goal })} />
            <EditGrid label="Diet Type" value={form.diet} options={DIET_OPTIONS} onChange={(diet) => setForm({ ...form, diet })} />
            <EditGrid label="Average Daily Budget" value={form.budget} options={BUDGET_OPTIONS} onChange={(budget) => setForm({ ...form, budget })} />
            <EditGrid label="Protein Preference" value={form.protein} options={PROTEIN_OPTIONS} onChange={(protein) => setForm({ ...form, protein })} />
            <EditGrid label="Cooking Time Preference" value={form.cookingTime} options={COOKING_OPTIONS} onChange={(cookingTime) => setForm({ ...form, cookingTime })} />
            <MultiGrid label="Cuisine Preference" values={form.cuisine} options={CUISINES} onToggle={(value) => setForm({ ...form, cuisine: toggleArray(form.cuisine, value) })} />
            <MultiGrid label="Allergies / Restrictions" values={form.allergies} options={ALLERGIES} onToggle={(value) => setForm({ ...form, allergies: toggleArray(form.allergies, value) })} />
            {error && <p className="font-black" style={{ color: "var(--danger)" }}>{error}</p>}
          </div>
        ) : (
          <div>
            <PreferenceRow label="Primary Goal" value={displayValues.goal} />
            <PreferenceRow label="Diet Type" value={displayValues.diet} />
            <PreferenceRow label="Cuisine Preference" value={displayValues.cuisine} />
            <PreferenceRow label="Average Daily Budget" value={displayValues.budget} />
            <PreferenceRow label="Protein Preference" value={displayValues.protein} />
            <PreferenceRow label="Cooking Time" value={displayValues.cookingTime} />
            <PreferenceRow label="Allergies / Restrictions" value={displayValues.allergies} />
          </div>
        )}
      </div>

      <History />
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-black mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function EditGrid({ label, value, options, onChange }) {
  return (
    <div>
      <p className="font-black mb-3">{label}</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {options.map(([optionValue, text]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`border-[3px] border-black rounded-xl p-3 font-black text-left shadow-neo-sm ${String(value) === String(optionValue) ? "theme-accent-bg" : "theme-muted"}`}
          >
            {text}
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
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`border-[3px] border-black rounded-xl p-3 font-black text-left shadow-neo-sm ${values.includes(option) ? "theme-accent-bg" : "theme-muted"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
