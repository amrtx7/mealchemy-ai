import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function displayPackage(item) {
  return item.packageLabel || `${item.amount} ${item.unit}`;
}

function storeBadgeClasses(storeSlug) {
  if (storeSlug === "blinkit") {
    return "bg-[#FFD84D] text-black";
  }
  if (storeSlug === "zepto") {
    return "bg-[#7C3AED] text-white";
  }
  return "theme-muted";
}

export default function Cart() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");
  const [selectedMap, setSelectedMap] = useState({});
  const {
    cart,
    setCart,
    totalCost,
    setTotalCost,
    meals,
    query,
    constraints,
    cartSummary,
    setCartSummary,
    ingredients,
  } = useMeals();

  useEffect(() => {
    if (cart.length === 0) {
      setSelectedMap({});
      return;
    }

    const next = {};
    cart.forEach((item, idx) => {
      next[`${item.name}-${idx}`] = true;
    });
    setSelectedMap(next);
  }, [cart]);

  useEffect(() => {
    async function buildCart() {
      if (cart.length > 0 || ingredients.length === 0) return;

      setBuilding(true);
      setError("");
      try {
        const { data } = await api.post("/cart/optimize", {
          ingredients,
          meals,
          constraints,
        });

        setCart(data.cartItems || []);
        setTotalCost(data.totalCost || 0);
        setCartSummary({
          selectedStore: data.selectedStore,
          storesUsed: data.storesUsed || [],
          budget: data.budget,
          budgetReason: data.budgetReason,
          fullCartTotal: data.fullCartTotal || 0,
          highPriorityTotal: data.highPriorityTotal || data.totalCost || 0,
          optionalTotal: data.optionalTotal || 0,
          availableCount: data.availableCount || 0,
          unavailableCount: data.unavailableCount || 0,
          withinBudget: data.withinBudget,
        });
      } catch (err) {
        setError("Failed to generate cart. Please try again.");
        console.error("Cart optimize error:", err);
      } finally {
        setBuilding(false);
      }
    }

    buildCart();
  }, [cart.length, constraints, ingredients, setCart, setCartSummary, setTotalCost]);

  const keyFor = (item, idx) => `${item.name}-${idx}`;
  const isSelected = (item, idx) => selectedMap[keyFor(item, idx)] !== false;

  const cartEntries = cart.map((item, idx) => ({ item, idx }));
  const selectedEntries = cartEntries.filter(({ item, idx }) => isSelected(item, idx));
  const deselectedEntries = cartEntries.filter(({ item, idx }) => !isSelected(item, idx));
  const selectedItems = selectedEntries.map(({ item }) => item);
  const highPriorityEntries = selectedEntries.filter(
    ({ item }) => item.priority !== "optional"
  );
  const optionalEntries = selectedEntries.filter(
    ({ item }) => item.priority === "optional"
  );
  const highPriorityItems = highPriorityEntries.map(({ item }) => item);
  const optionalItems = optionalEntries.map(({ item }) => item);
  const highPriorityTotal =
    cartSummary?.highPriorityTotal ??
    highPriorityItems.reduce((sum, item) => sum + (item.price || 0), 0) ??
    totalCost;
  const optionalTotal =
    cartSummary?.optionalTotal ??
    optionalItems.reduce((sum, item) => sum + (item.available === false ? 0 : item.price || 0), 0);
  const fullCartTotal = cartSummary?.fullCartTotal ?? highPriorityTotal + optionalTotal;
  const userSelectedTotal = selectedItems.reduce(
    (sum, item) => sum + (item.available === false ? 0 : item.price || 0),
    0
  );
  const budget = cartSummary?.budget ?? constraints?.budget;
  const storesUsed = cartSummary?.storesUsed?.length
    ? cartSummary.storesUsed.join(", ")
    : Array.from(new Set(cart.filter((item) => item.available !== false).map((item) => item.store))).join(", ");

  const toggleItem = (item, idx) => {
    const key = keyFor(item, idx);
    setSelectedMap((prev) => ({
      ...prev,
      [key]: prev[key] === false,
    }));
  };

  const handleSave = async () => {
    console.log("[Cart] Save clicked", {
      cartCount: cart.length,
      selectedCount: selectedItems.length,
      query,
      mealsCount: meals.length,
      hasConstraints: Boolean(constraints),
    });

    setSaving(true);
    setError("");
    try {
      const finalCart = cart.filter((item, idx) => isSelected(item, idx));
      const payload = {
        query: query || "Generated Meal Plan",
        meals: meals.length ? meals : [{ meal: "Custom Plan", ingredients: [] }],
        cart: finalCart,
        constraints,
        totalCost: finalCart.reduce(
          (sum, item) => sum + (item.available === false ? 0 : item.price || 0),
          0
        ),
      };

      console.log("[Cart] Save payload", {
        query: payload.query,
        mealsCount: payload.meals.length,
        cartCount: payload.cart.length,
        totalCost: payload.totalCost,
        sampleMeal: payload.meals[0] || null,
        sampleCartItem: payload.cart[0] || null,
      });

      const response = await api.post("/meals/save", payload);
      console.log("[Cart] Save success", {
        status: response.status,
        id: response?.data?._id,
      });
      navigate("/history");
    } catch (err) {
      console.error("[Cart] Save failed", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError(
        err?.response?.data?.message ||
          "Failed to save cart. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAgain = () => {
    navigate("/");
  };

  const renderItem = (item, idx) => {
    const isOptional = item.priority === "optional" || item.available === false;
    const included = isSelected(item, idx);

    return (
      <article
        key={`${item.name}-${idx}`}
        className="theme-raised p-5 grid md:grid-cols-[1.35fr_0.7fr_0.8fr_0.7fr] gap-4 items-center"
      >
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span
              className={`px-2.5 py-1 text-xs font-black rounded-md border-brutal border-black shadow-neo-sm ${
                !included || isOptional ? "theme-muted-text bg-[var(--surface-raised)]" : "theme-accent-bg"
              }`}
            >
              {!included ? "Removed by you" : item.available === false ? "Unavailable" : item.priorityLabel || "High priority"}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-md border-brutal border-black shadow-neo-sm ${storeBadgeClasses(item.storeSlug)}`}
            >
              {item.store || "No store"}
            </span>
          </div>
          <div className="grid grid-cols-[84px_1fr] gap-4 items-start">
            <div className="aspect-square rounded-xl border-[3px] border-black bg-[#F8F4EC] overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName || item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-center px-2">
                  No image
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-black theme-text capitalize leading-tight">
                {item.name}
              </h3>
              <p className="text-sm theme-muted-text mt-1 capitalize">
                {item.available === false ? item.unavailableReason || "No product match" : "Matched product"}
              </p>
              {item.productName ? (
                <a
                  href={item.productUrl || undefined}
                  target={item.productUrl ? "_blank" : undefined}
                  rel={item.productUrl ? "noreferrer" : undefined}
                  className="mt-2 inline-block text-base font-black theme-text underline decoration-[3px] underline-offset-4"
                >
                  {item.productName}
                </a>
              ) : null}
              {item.deliveryTime ? (
                <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mt-2">
                  {item.deliveryTime}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="theme-muted p-4">
          <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-1">Quantity</p>
          <p className="text-xl font-black theme-text">{displayPackage(item)}</p>
        </div>

        <div className="theme-muted p-4">
          <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-1">Reason</p>
          <p className="text-sm theme-text leading-snug">
            {!included
              ? "You removed this from the final cart, but it stays visible here for transparency."
              : item.reason || (isOptional ? "Optional for this budget." : "Included in recommended cart.")}
          </p>
        </div>

        <div className="text-left md:text-right space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest theme-muted-text mb-1">Price</p>
            {item.available === false ? (
              <p className="font-bold" style={{ color: "var(--danger)" }}>
                Not priced
              </p>
            ) : (
              <p className={`text-3xl font-black ${!included || isOptional ? "theme-muted-text" : "theme-accent"}`}>
                {money(item.price)}
              </p>
            )}
          </div>
          <button
            type="button"
            className={included ? "btn-secondary whitespace-nowrap text-sm px-4 py-2" : "btn-primary whitespace-nowrap text-sm px-4 py-2"}
            onClick={() => toggleItem(item, idx)}
          >
            {included ? "Remove" : "Add back"}
          </button>
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
          Every ingredient from your selected meals stays visible here. Budget logic only changes priority and recommendations.
        </p>
      </div>

      {error && (
        <div className="theme-raised p-4 text-center" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {building ? (
        <div className="text-center py-20 theme-muted">
          <p className="theme-muted-text text-lg mb-6">Building your cart from the full recipe ingredient list...</p>
        </div>
      ) : cart.length === 0 ? (
        <div className="text-center py-20 theme-muted">
          <p className="theme-muted-text text-lg mb-6">Your cart is empty. Please select meals to generate a cart.</p>
          <button className="btn-primary" onClick={handleGenerateAgain}>Start Over</button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="theme-hero p-6 md:p-8">
            <div className="grid md:grid-cols-5 gap-4">
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
                <p className="text-xs uppercase tracking-widest opacity-75">Your Final Cart</p>
                <p className="text-3xl font-black">{money(userSelectedTotal)}</p>
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
                highPriorityEntries.map(({ item, idx }) => renderItem(item, idx))
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
                These ingredients still belong to the recipe. They stay visible, but the optimizer flags them as expensive,
                non-core, unavailable, or likely to push the cart above budget.
              </p>
              <div className="space-y-4">{optionalEntries.map(({ item, idx }) => renderItem(item, idx))}</div>
            </div>
          )}

          {deselectedEntries.length > 0 && (
            <div>
              <h2 className="text-3xl font-black theme-text mb-2">Removed By You</h2>
              <p className="theme-muted-text mb-4">
                These ingredients are still shown for transparency, but they will not be included when you save this cart.
              </p>
              <div className="space-y-4">
                {deselectedEntries.map(({ item, idx }) => renderItem(item, idx))}
              </div>
            </div>
          )}

          <div className="theme-raised p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="grid sm:grid-cols-4 gap-5 w-full md:w-auto">
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
              <div>
                <p className="theme-muted-text text-xs font-bold uppercase tracking-widest mb-1">Selected Total</p>
                <p className="text-3xl font-black theme-text">{money(userSelectedTotal)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button className="btn-secondary whitespace-nowrap" onClick={handleGenerateAgain}>
                Start Over
              </button>
              <button
                className="btn-primary whitespace-nowrap disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || selectedItems.length === 0}
              >
                {saving ? "Saving..." : "Save Cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
