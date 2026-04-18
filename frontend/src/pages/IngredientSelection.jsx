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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#164E40]/10 text-[#164E40] text-sm font-bold tracking-wider uppercase mb-6">
          <span>Step 3 of 4</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E79B48] inline-block" />
          <span>User-in-the-Loop</span>
        </div>
        <h1 className="text-5xl font-serif text-[#164E40] mb-4">
          Select Ingredients to Purchase
        </h1>
        <p className="text-[#164E40]/70 text-lg max-w-xl mx-auto">
          These are the raw groceries needed for your chosen dishes. Deselect
          anything you already have at home.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between bg-[#F4EFE5] border border-[#E8DDCA] rounded-2xl px-6 py-4 mb-8">
        <p className="text-[#164E40] font-semibold text-sm">
          <span className="text-[#E79B48] font-serif text-2xl font-bold">
            {selectedCount}
          </span>{" "}
          of {totalCount} ingredients selected
        </p>
        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="text-xs font-bold uppercase tracking-wider text-[#164E40] bg-white border border-[#E8DDCA] hover:border-[#164E40] px-4 py-2 rounded-full transition-all"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className="text-xs font-bold uppercase tracking-wider text-[#164E40]/60 hover:text-[#164E40] px-4 py-2 rounded-full transition-all"
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
                relative flex flex-col items-center gap-3 p-5 rounded-3xl border-2 cursor-pointer
                transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group
                ${
                  isSelected
                    ? "border-[#E79B48] bg-[#FDFBF6] shadow-[0_4px_20px_rgba(231,155,72,0.18)] ring-1 ring-[#E79B48]"
                    : "border-[#E8DDCA] bg-[#F4EFE5] opacity-60 hover:opacity-80 hover:border-[#164E40]/20"
                }
              `}
              style={{ animationDelay: `${idx * 40}ms` }}
              aria-pressed={isSelected}
            >
              {/* Checkmark badge */}
              <span
                className={`
                  absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200
                  ${isSelected ? "border-[#E79B48] bg-[#E79B48]" : "border-[#E8DDCA] bg-white"}
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
        <p className="text-red-500 font-medium bg-red-50 px-6 py-3 rounded-2xl border border-red-200 text-center mb-6">
          {error}
        </p>
      )}

      {/* Action footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#F4EFE5] border border-[#E8DDCA] rounded-3xl px-8 py-6">
        <div>
          <p className="text-[#164E40]/60 text-sm uppercase font-bold tracking-wider mb-1">
            Ready to optimize
          </p>
          <p className="text-[#164E40] font-medium">
            Your cart will be built from{" "}
            <span className="font-serif font-bold text-[#E79B48] text-xl">
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
