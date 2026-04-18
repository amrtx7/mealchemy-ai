import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function displayPackage(item) {
  return item.packageLabel || `${item.amount} ${item.unit}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const { cart, totalCost, meals, query, constraints, cartSummary } = useMeals();

  const highPriorityItems = cart.filter((item) => item.priority !== "optional" && item.available !== false);
  const optionalItems = cart.filter((item) => item.priority === "optional" || item.available === false);
  const highPriorityTotal =
    cartSummary?.highPriorityTotal ??
    highPriorityItems.reduce((sum, item) => sum + (item.price || 0), 0) ??
    totalCost;
  const optionalTotal =
    cartSummary?.optionalTotal ?? optionalItems.reduce((sum, item) => sum + (item.available === false ? 0 : item.price || 0), 0);
  const fullCartTotal = cartSummary?.fullCartTotal ?? highPriorityTotal + optionalTotal;
  const budget = cartSummary?.budget ?? constraints?.budget;
  const storesUsed = cartSummary?.storesUsed?.length
    ? cartSummary.storesUsed.join(", ")
    : Array.from(new Set(cart.filter((item) => item.available !== false).map((item) => item.store))).join(", ");

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/meals/save", {
        query: query || "Generated Meal Plan",
        meals: meals.length ? meals : [{ meal: "Custom Plan", ingredients: [] }],
        cart,
        constraints,
        totalCost: highPriorityTotal,
      });
      navigate("/history");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAgain = () => {
    navigate("/");
  };

  const renderItem = (item, idx) => {
    const isOptional = item.priority === "optional" || item.available === false;

    return (
      <article
        key={`${item.name}-${idx}`}
        className="theme-raised p-5 grid md:grid-cols-[1.2fr_0.8fr_0.8fr_0.55fr] gap-4 items-center"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2.5 py-1 text-xs font-black rounded-md border-brutal border-black shadow-neo-sm ${
                isOptional ? "theme-muted-text bg-[var(--surface-raised)]" : "theme-accent-bg"
              }`}
            >
              {item.available === false ? "Unavailable" : item.priorityLabel || "High priority"}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest theme-muted-text">
              {item.store || "No store"}
            </span>
          </div>
          <h3 className="text-2xl font-black theme-text capitalize leading-tight">
            {item.name}
          </h3>
          <p className="text-sm theme-muted-text mt-1 capitalize">
            {item.productName || item.unavailableReason || "No product match"}
          </p>
        </div>

        <div className="theme-muted p-4">
          <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-1">Quantity</p>
          <p className="text-xl font-black theme-text">{displayPackage(item)}</p>
        </div>

        <div className="theme-muted p-4">
          <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-1">Reason</p>
          <p className="text-sm theme-text leading-snug">
            {item.reason || (isOptional ? "Optional for this budget." : "Included in recommended cart.")}
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-1">Price</p>
          {item.available === false ? (
            <p className="font-bold" style={{ color: "var(--danger)" }}>
              Not priced
            </p>
          ) : (
            <p className={`text-3xl font-black ${isOptional ? "theme-muted-text" : "theme-accent"}`}>
              {money(item.price)}
            </p>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="max-w-6xl mx-auto my-12 px-6">
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] theme-accent mb-3">
          Budget-Aware Cart
        </p>
        <h1 className="text-4xl md:text-5xl font-black theme-text mb-4 drop-shadow-[2px_2px_0_var(--border)]">Optimized Grocery Cart</h1>
        <p className="theme-muted-text text-lg">
          Items are priced first, then separated into high-priority and optional buys.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 theme-muted">
          <p className="theme-muted-text text-lg mb-6">Your cart is empty. Please select meals to generate a cart.</p>
          <button className="btn-primary" onClick={handleGenerateAgain}>Start Over</button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="theme-hero p-6 md:p-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Budget</p>
                <p className="text-3xl font-black">{budget ? money(budget) : "Not set"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Recommended</p>
                <p className="text-3xl font-black">{money(highPriorityTotal)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Full Cart</p>
                <p className="text-3xl font-black">{money(fullCartTotal)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Stores Used</p>
                <p className="text-lg font-bold leading-tight">{storesUsed || "Unavailable"}</p>
              </div>
            </div>
            {cartSummary?.budgetReason && (
              <p className="mt-5 text-sm opacity-85 max-w-4xl">{cartSummary.budgetReason}</p>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-black theme-text mb-4">High Priority</h2>
            <div className="space-y-4">
              {highPriorityItems.length > 0 ? (
                highPriorityItems.map(renderItem)
              ) : (
                <div className="theme-muted p-6 theme-muted-text">
                  No high-priority items fit the current budget.
                </div>
              )}
            </div>
          </div>

          {optionalItems.length > 0 && (
            <div>
              <h2 className="text-3xl font-black theme-text mb-2">Optional / Budget Risks</h2>
              <p className="theme-muted-text mb-4">
                These are useful, but they were removed from the recommended total because they are expensive,
                non-core, unavailable, or push the cart too far above budget.
              </p>
              <div className="space-y-4">{optionalItems.map(renderItem)}</div>
            </div>
          )}

          <div className="theme-raised p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="grid sm:grid-cols-3 gap-5 w-full md:w-auto">
              <div>
                <p className="theme-muted-text text-xs font-bold uppercase tracking-widest mb-1">Recommended Total</p>
                <p className="text-4xl font-black theme-accent">{money(highPriorityTotal)}</p>
              </div>
              <div>
                <p className="theme-muted-text text-xs font-bold uppercase tracking-widest mb-1">Optional Total</p>
                <p className="text-3xl font-black theme-muted-text">{money(optionalTotal)}</p>
              </div>
              <div>
                <p className="theme-muted-text text-xs font-bold uppercase tracking-widest mb-1">Full Cart Total</p>
                <p className="text-3xl font-black theme-text">{money(fullCartTotal)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button className="btn-secondary whitespace-nowrap" onClick={handleGenerateAgain}>
                Start Over
              </button>
              <button
                className="btn-primary whitespace-nowrap disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || cart.length === 0}
              >
                {saving ? "Saving..." : "Save Recommended List"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
