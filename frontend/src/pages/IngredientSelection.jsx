import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Simple emoji mapping by keyword for a richer UI
function ingredientEmoji(name) {
  const lower = name.toLowerCase();
  if (lower.includes("oil")) return "🫙";
  if (lower.includes("atta") || lower.includes("flour") || lower.includes("maida")) return "🌾";
  if (lower.includes("paneer")) return "🧀";
  if (lower.includes("rice")) return "🍚";
  if (lower.includes("dal") || lower.includes("lentil")) return "🫘";
  if (lower.includes("peanut")) return "🥜";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("onion")) return "🧅";
  if (lower.includes("garlic")) return "🧄";
  if (lower.includes("chilli") || lower.includes("chili") || lower.includes("pepper")) return "🌶️";
  if (lower.includes("turmeric") || lower.includes("spice") || lower.includes("masala") || lower.includes("cumin") || lower.includes("coriander")) return "🌿";
  if (lower.includes("salt")) return "🧂";
  if (lower.includes("sugar") || lower.includes("jaggery")) return "🍬";
  if (lower.includes("milk") || lower.includes("curd") || lower.includes("yogurt") || lower.includes("ghee") || lower.includes("butter")) return "🥛";
  if (lower.includes("potato") || lower.includes("aloo")) return "🥔";
  if (lower.includes("spinach") || lower.includes("methi") || lower.includes("palak")) return "🥬";
  if (lower.includes("ginger")) return "🫚";
  if (lower.includes("lemon") || lower.includes("lime")) return "🍋";
  if (lower.includes("coconut")) return "🥥";
  return "🛒";
}

export default function IngredientSelection() {
  const navigate = useNavigate();
  const { ingredients, setCart, setTotalCost, setCartSummary, constraints } = useMeals();

  // All selected by default
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-select all ingredients when they load
  useEffect(() => {
    if (ingredients.length > 0) {
      setSelected(new Set(ingredients));
    }
  }, [ingredients]);

  // If someone lands here directly with no ingredients, redirect to home
  useEffect(() => {
    if (ingredients.length === 0) {
      navigate("/");
    }
  }, []); // eslint-disable-line

  const toggle = (item) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(ingredients));
  const clearAll = () => setSelected(new Set());

  const proceedToCart = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    setError("");
    try {
      const chosenIngredients = Array.from(selected);
      const { data } = await api.post("/cart/optimize", {
        ingredients: chosenIngredients,
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
      navigate("/cart");
    } catch (err) {
      setError("Failed to generate cart. Please try again.");
      console.error("Cart optimize error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selected.size;
  const totalCount = ingredients.length;

  return (
    <section className="max-w-5xl mx-auto my-16 px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FDFBF6] text-[#164E40] text-xs font-black tracking-wider uppercase mb-6 border-brutal border-black shadow-neo-sm">
          <span>Step 3 of 4</span>
          <span className="w-2 h-2 rounded-sm bg-[#E79B48] inline-block border border-black" />
          <span>User-in-the-Loop</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#164E40] mb-4 drop-shadow-[2px_2px_0_#000]">
          Select Ingredients to Purchase
        </h1>
        <p className="text-[#164E40]/70 text-lg max-w-xl mx-auto">
          These are the raw groceries needed for your chosen dishes. Deselect
          anything you already have at home.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F4EFE5] border-brutal border-black rounded-xl px-5 py-4 mb-8 shadow-neo">
        <p className="text-[#164E40] font-bold text-sm">
          <span className="text-[#E79B48] font-black text-2xl tabular-nums">
            {selectedCount}
          </span>{" "}
          of {totalCount} ingredients selected
        </p>
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            type="button"
            className="text-xs font-black uppercase tracking-wider text-[#164E40] bg-white border-brutal border-black px-4 py-2 rounded-md shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            type="button"
            className="text-xs font-black uppercase tracking-wider text-[#164E40] bg-[#fff3bf] border-brutal border-black px-4 py-2 rounded-md shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Ingredient Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
        {ingredients.map((item, idx) => {
          const isSelected = selected.has(item);
          return (
            <button
              key={item}
              id={`ingredient-${idx}`}
              onClick={() => toggle(item)}
              className={`
                relative flex flex-col items-center gap-3 p-4 md:p-5 rounded-xl border-brutal border-black cursor-pointer
                transition-all duration-200 hover:-translate-y-0.5 shadow-neo group
                ${
                  isSelected
                    ? "bg-[#FDFBF6] shadow-neo-lg ring-0 outline outline-[3px] outline-[#E79B48] -outline-offset-[3px]"
                    : "bg-[#F4EFE5] opacity-75 hover:opacity-100 hover:shadow-neo-lg"
                }
              `}
              style={{ animationDelay: `${idx * 40}ms` }}
              aria-pressed={isSelected}
            >
              {/* Checkmark badge */}
              <span
                className={`
                  absolute top-3 right-3 w-6 h-6 rounded-md border-brutal border-black flex items-center justify-center
                  transition-all duration-200 shadow-neo-sm
                  ${isSelected ? "bg-[#E79B48]" : "bg-white"}
                `}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>

              {/* Emoji icon */}
              <span className="text-4xl leading-none transition-transform duration-300 group-hover:scale-110">
                {ingredientEmoji(item)}
              </span>

              {/* Name */}
              <span
                className={`text-sm font-bold text-center leading-tight transition-colors ${
                  isSelected ? "text-[#164E40]" : "text-[#164E40]/50"
                }`}
              >
                {capitalize(item)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[#8b0000] font-bold bg-[#ffe5e5] px-6 py-3 rounded-lg border-brutal border-black shadow-neo-sm text-center mb-6">
          {error}
        </p>
      )}

      {/* Action footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#F4EFE5] border-brutal border-black rounded-2xl px-6 md:px-8 py-6 shadow-neo">
        <div>
          <p className="text-[#164E40]/60 text-sm uppercase font-bold tracking-wider mb-1">
            Ready to optimize
          </p>
          <p className="text-[#164E40] font-medium">
            Your cart will be built from{" "}
            <span className="font-black text-[#E79B48] text-xl tabular-nums">
              {selectedCount}
            </span>{" "}
            ingredient{selectedCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            className="btn-secondary whitespace-nowrap"
            onClick={() => navigate("/meals")}
          >
            ← Back to Meals
          </button>
          <button
            className="btn-primary whitespace-nowrap px-10 py-4 text-lg disabled:opacity-50"
            onClick={proceedToCart}
            disabled={loading || selectedCount === 0}
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Building Cart...
              </span>
            ) : (
              "Proceed to Cart 🛒"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
