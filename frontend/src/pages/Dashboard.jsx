import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function mealTypeOf(meal, fallback = "") {
  const value = String(meal?.mealType || fallback || "").toLowerCase();
  if (value.includes("breakfast")) return "Breakfast";
  if (value.includes("lunch")) return "Lunch";
  if (value.includes("dinner")) return "Dinner";
  if (value.includes("snack")) return "Snack";
  return "Meal";
}

function groupMealsByType(plans) {
  const grouped = { Breakfast: [], Lunch: [], Dinner: [], Snack: [], Meal: [] };

  for (const plan of plans) {
    const fallbackType = plan?.constraints?.mealType;
    for (const meal of plan.meals || []) {
      const type = mealTypeOf(meal, fallbackType);
      grouped[type] = grouped[type] || [];
      grouped[type].push({ ...meal, plan });
    }
  }

  return grouped;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function capitalizeName(name) {
  if (!name) return "Chef";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [data, setData] = useState({ user: null, todayMealPlan: null, plans: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/meals/dashboard");
        setData({
          user: res.data.user,
          todayMealPlan: res.data.todayMealPlan,
          plans: res.data.plans || res.data.recentMeals || [],
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    }

    load();
  }, []);

  const userName = capitalizeName(data.user?.name || authUser?.name);
  const weekStart = startOfWeek(new Date());
  const weeklyPlans = data.plans.filter((plan) => new Date(plan.createdAt) >= weekStart);
  const todayGrouped = groupMealsByType(data.todayMealPlan ? [data.todayMealPlan] : []);
  const weeklyGrouped = useMemo(() => groupMealsByType(weeklyPlans), [weeklyPlans]);
  const weeklyMeals = weeklyPlans.reduce((sum, plan) => sum + (plan.meals?.length || 0), 0);
  const weeklySpend = weeklyPlans.reduce((sum, plan) => sum + (plan.totalCost || 0), 0);
  const latestPlans = data.plans.slice(0, 3);

  return (
    <section className="max-w-6xl mx-auto my-10 px-6 space-y-8">
      <div className="relative overflow-hidden theme-hero p-8 md:p-10 rounded-[2rem] shadow-sm">
        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/15" />
        <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] mb-3 opacity-80">
              Your Kitchen Today
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight">
              Welcome back, {userName}
            </h1>
            <p className="mt-3 max-w-2xl opacity-85">
              A quick glance at today&apos;s plan, this week&apos;s rhythm, and your latest saved carts.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="theme-accent-bg rounded-full px-8 py-4 font-bold shadow-lg hover:scale-[1.02] transition-transform"
          >
            Plan a New Meal
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-center border theme-raised" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["This Week", weeklyPlans.length, "saved plans", "theme-text"],
          ["Meals", weeklyMeals, "planned this week", "theme-text"],
          ["Grocery Spend", `₹${weeklySpend}`, "from saved carts", "theme-accent"],
        ].map(([label, value, caption, valueClass]) => (
          <div key={label} className="theme-raised rounded-[1.5rem] p-5 border">
            <p className="text-xs uppercase tracking-widest theme-muted-text font-bold">{label}</p>
            <p className={`text-4xl font-serif font-bold mt-2 ${valueClass}`}>{value}</p>
            <p className="text-sm theme-muted-text">{caption}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_0.85fr] gap-8">
        <div className="theme-raised p-6 rounded-[2rem] border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest theme-accent">Today</p>
              <h2 className="text-3xl font-serif font-bold theme-text">Meal Plan</h2>
            </div>
            <span className="px-4 py-2 rounded-full theme-muted text-sm font-bold">
              {data.todayMealPlan ? formatDate(data.todayMealPlan.createdAt) : "No plan"}
            </span>
          </div>

          {data.todayMealPlan ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {MEAL_TYPES.map((type) => (
                <div key={type} className="theme-muted rounded-2xl p-4 border">
                  <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-2">
                    {type}
                  </p>
                  {(todayGrouped[type] || []).length > 0 ? (
                    <div className="space-y-2">
                      {todayGrouped[type].map((meal, idx) => (
                        <p key={`${type}-${idx}`} className="font-bold theme-text">
                          {meal.meal}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm theme-muted-text">No {type.toLowerCase()} saved.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="theme-muted p-8 rounded-3xl text-center border border-dashed">
              <p className="theme-muted-text font-medium mb-5">No meals generated today.</p>
              <button className="btn-primary" onClick={() => navigate("/")}>
                Create Today&apos;s Plan
              </button>
            </div>
          )}
        </div>

        <div className="theme-muted p-6 rounded-[2rem] border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-2">
            Meal Mix
          </p>
          <h2 className="text-3xl font-serif font-bold theme-text mb-5">
            This Week&apos;s Balance
          </h2>
          <div className="space-y-3">
            {MEAL_TYPES.map((type) => {
              const count = (weeklyGrouped[type] || []).length;
              const width = weeklyMeals ? Math.max(10, Math.round((count / weeklyMeals) * 100)) : 0;
              return (
                <div key={type} className="theme-raised rounded-2xl p-4 border">
                  <div className="flex justify-between text-sm font-bold theme-text mb-2">
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full theme-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${width}%`, background: "var(--primary)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="theme-raised p-6 rounded-[2rem] border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest theme-accent">Quick Access</p>
            <h2 className="text-3xl font-serif font-bold theme-text">Latest Saved Plans</h2>
          </div>
          <button className="btn-secondary px-5 py-3 text-sm" onClick={() => navigate("/history")}>
            Open History
          </button>
        </div>

        {latestPlans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {latestPlans.map((plan) => (
              <article key={plan._id} className="theme-muted rounded-2xl p-4 border">
                <p className="font-serif font-bold text-xl theme-text leading-tight">
                  {plan.query || "Generated Plan"}
                </p>
                <p className="text-xs theme-muted-text mt-2">
                  {formatDate(plan.createdAt)} · ₹{plan.totalCost || 0}
                </p>
                <p className="text-sm theme-muted-text mt-3">
                  {(plan.meals || []).slice(0, 2).map((meal) => meal.meal).join(", ") || "No meals listed"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="theme-muted p-8 rounded-3xl text-center border border-dashed">
            <p className="theme-muted-text font-medium">Saved plans will appear here after you save a cart.</p>
          </div>
        )}
      </div>
    </section>
  );
}
