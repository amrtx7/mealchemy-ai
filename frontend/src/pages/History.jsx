import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

const PERIODS = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfPeriod(period) {
  const now = new Date();
  if (period === "week") return startOfWeek(now);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

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

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState("week");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setCart, setTotalCost, setMeals, setCartSummary } = useMeals();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/meals/history");
        setHistory(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load history");
      }
    }

    load();
  }, []);

  const filteredHistory = useMemo(() => {
    const start = startOfPeriod(period);
    if (!start) return history;
    return history.filter((entry) => new Date(entry.createdAt) >= start);
  }, [history, period]);

  const grouped = useMemo(() => groupMealsByType(filteredHistory), [filteredHistory]);
  const totalCost = filteredHistory.reduce((sum, entry) => sum + (entry.totalCost || 0), 0);
  const totalMeals = filteredHistory.reduce((sum, entry) => sum + (entry.meals?.length || 0), 0);

  const viewCart = (entry) => {
    setCart(entry.cart || []);
    setTotalCost(entry.totalCost || 0);
    setMeals(entry.meals || []);
    setCartSummary(null);
    navigate("/cart");
  };

  const viewRecipe = (entry) => {
    navigate(`/history/${entry._id}`);
  };

  return (
    <section className="max-w-6xl mx-auto my-10 px-6 space-y-8">
      <div className="theme-raised p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] theme-accent mb-3">
              Saved Plans
            </p>
            <h1 className="text-4xl md:text-5xl font-black theme-text">
              Meal History
            </h1>
            <p className="theme-muted-text mt-3 max-w-2xl">
              Browse your plans by week, month, year, and meal type.
            </p>
          </div>

          <div className="flex gap-2 theme-muted p-1.5 rounded-lg border-brutal border-black shadow-neo-sm overflow-x-auto">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className={`px-4 py-2 rounded-md text-sm font-black whitespace-nowrap transition-all border-brutal border-black ${
                  period === item.key
                    ? "btn-primary !shadow-none translate-x-0.5 translate-y-0.5"
                    : "theme-muted-text bg-[var(--surface-raised)] shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="theme-hero p-4">
            <p className="text-xs uppercase tracking-widest opacity-75 font-bold">Plans</p>
            <p className="text-3xl font-black">{filteredHistory.length}</p>
          </div>
          <div className="theme-muted p-4">
            <p className="text-xs uppercase tracking-widest theme-muted-text font-bold">Meals</p>
            <p className="text-3xl font-black theme-text">{totalMeals}</p>
          </div>
          <div className="theme-muted p-4">
            <p className="text-xs uppercase tracking-widest theme-muted-text font-bold">Spend</p>
            <p className="text-3xl font-black theme-accent">₹{totalCost}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-center border theme-raised" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {filteredHistory.length === 0 && !error ? (
        <div className="theme-raised p-16 text-center">
          <p className="theme-muted-text font-medium text-lg">No meal plans found for this period.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
          <div className="theme-raised p-6">
            <h2 className="text-3xl font-black theme-text mb-6">
              Meal Timeline
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[...MEAL_TYPES, "Meal"].map((type) => {
                const meals = grouped[type] || [];
                if (meals.length === 0) return null;

                return (
                  <div key={type} className="theme-muted p-5">
                    <h3 className="font-black text-2xl theme-text mb-4">
                      {type === "Meal" ? "Other Meals" : type}
                    </h3>
                    <div className="space-y-3">
                      {meals.map((meal, idx) => (
                        <div key={`${type}-${meal.meal}-${idx}`} className="theme-raised p-3">
                          <p className="font-bold theme-text leading-tight">{meal.meal}</p>
                          <p className="text-xs theme-muted-text mt-1">
                            {formatDate(meal.plan.createdAt)} · ₹{meal.plan.totalCost || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {filteredHistory.map((entry) => (
              <article
                key={entry._id}
                className="theme-raised p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-black theme-text">
                      {entry.query || "Generated Plan"}
                    </h3>
                    <p className="text-xs font-medium theme-muted-text mt-1">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <p className="text-2xl font-black theme-accent">
                    ₹{entry.totalCost || 0}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {(entry.meals || []).slice(0, 5).map((meal, idx) => (
                    <span
                      key={`${entry._id}-${idx}`}
                      className="px-2.5 py-1 theme-muted text-xs font-black rounded-md shadow-neo-sm"
                    >
                      {meal.meal}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => viewCart(entry)}
                  className="btn-secondary whitespace-nowrap w-full py-3 px-8 text-sm"
                >
                  View Cart
                </button>

                <button
                  onClick={() => viewRecipe(entry)}
                  className="btn-primary whitespace-nowrap w-full py-3 px-8 text-sm mt-3"
                >
                  View Recipe
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
