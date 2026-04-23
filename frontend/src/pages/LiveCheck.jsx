import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useMeals } from "../context/MealContext";

function money(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
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

function resultStatusText(result) {
  if (result.selectedProduct) {
    return `${result.selectedStore} looks better for ${result.ingredient}.`;
  }
  return `No live match yet for ${result.ingredient}.`;
}

export default function LiveCheck() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [substep, setSubstep] = useState(0);
  const {
    ingredients,
    meals,
    constraints,
    setCart,
    setTotalCost,
    setCartSummary,
    liveCheck,
    setLiveCheck,
  } = useMeals();

  const loadingSteps = useMemo(
    () => ["Checking priority ingredients", "Searching Blinkit and Zepto", "Comparing best matches"],
    []
  );

  useEffect(() => {
    if (!ingredients.length) {
      navigate("/meals");
      return;
    }

    const interval = window.setInterval(() => {
      setSubstep((current) => (current + 1) % loadingSteps.length);
    }, 1200);

    async function runLiveCheck() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.post("/meal/live-check", {
          ingredients,
          meals,
          constraints,
        });
        setLiveCheck(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Live store check failed. You can still continue to the cart.");
      } finally {
        setLoading(false);
        window.clearInterval(interval);
      }
    }

    runLiveCheck();

    return () => window.clearInterval(interval);
  }, [constraints, ingredients, loadingSteps.length, meals, navigate, setLiveCheck]);

  const continueToCart = () => {
    const preview = liveCheck?.cartPreview;
    if (preview?.cartItems?.length) {
      setCart(preview.cartItems);
      setTotalCost(preview.totalCost || 0);
      setCartSummary({
        selectedStore: preview.selectedStore,
        storesUsed: preview.storesUsed || [],
        budget: preview.budget,
        budgetReason: preview.budgetReason,
        fullCartTotal: preview.fullCartTotal || 0,
        highPriorityTotal: preview.highPriorityTotal || preview.totalCost || 0,
        optionalTotal: preview.optionalTotal || 0,
        availableCount: preview.availableCount || 0,
        unavailableCount: preview.unavailableCount || 0,
        withinBudget: preview.withinBudget,
      });
    } else {
      setCart([]);
      setTotalCost(0);
      setCartSummary(null);
    }

    navigate("/cart");
  };

  const isLiveModeOff = liveCheck?.mode === "off";
  const hasNoLiveMatches = !loading && !error && liveCheck?.priorityIngredients?.length && !liveCheck?.hasLiveResults;

  return (
    <section className="max-w-6xl mx-auto my-12 px-6">
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] theme-accent mb-3">Live Ingredient Check</p>
        <h1 className="text-4xl md:text-5xl font-black theme-text mb-4 drop-shadow-[2px_2px_0_var(--border)]">
          Store Matchup Before Cart
        </h1>
        <p className="theme-muted-text text-lg max-w-3xl mx-auto">
          We include a maximum of 5 priority ingredients for live store checks, then pass the best matches into your cart.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="theme-raised p-8 md:p-10 bg-[linear-gradient(135deg,#fff6cf_0%,#ffffff_55%,#efe6ff_100%)]">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] mb-4">Scanning Stores</p>
                <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">
                  Checking live prices for your meal&apos;s priority ingredients
                </h2>
                <p className="theme-muted-text text-lg mb-6">{loadingSteps[substep]}</p>
                <div className="flex flex-wrap gap-3">
                  {loadingSteps.map((step, index) => (
                    <div
                      key={step}
                      className={`px-4 py-3 rounded-xl border-[3px] border-black font-black text-sm shadow-[4px_4px_0_0_#000] transition-transform ${
                        index === substep ? "bg-[#FF5D5D] text-white -translate-y-1" : "bg-white text-black"
                      }`}
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="theme-raised p-5 bg-[#FFD84D] animate-loader-hop">
                  <p className="text-xs uppercase font-black tracking-[0.2em] mb-2">Blinkit</p>
                  <div className="h-4 w-24 bg-black/10 border-2 border-black rounded mb-3" />
                  <div className="h-16 bg-white border-[3px] border-black rounded-xl" />
                </div>
                <div className="theme-raised p-5 bg-[#E9D5FF] animate-loader-hop-delayed">
                  <p className="text-xs uppercase font-black tracking-[0.2em] mb-2">Zepto</p>
                  <div className="h-4 w-24 bg-black/10 border-2 border-black rounded mb-3" />
                  <div className="h-16 bg-white border-[3px] border-black rounded-xl" />
                </div>
                <div className="col-span-2 theme-raised p-5 bg-white">
                  <div className="h-4 w-32 bg-black/10 border-2 border-black rounded mb-4" />
                  <div className="grid md:grid-cols-3 gap-3">
                    {[0, 1, 2].map((box) => (
                      <div key={box} className="h-24 border-[3px] border-black rounded-xl bg-[#F4EFE5] animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="theme-raised p-4 text-center" style={{ color: "var(--danger)" }}>
              {error}
            </div>
          )}

          {isLiveModeOff && (
            <div className="theme-raised p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] theme-accent mb-2">Live Pricing Is Off</p>
              <p className="theme-muted-text">
                Real-time Blinkit and Zepto lookup is currently disabled on the backend, so this page is previewing the flow but the cart is still using fallback pricing.
              </p>
            </div>
          )}

          {hasNoLiveMatches ? (
            <div className="theme-raised p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] theme-accent mb-2">No Live Matches Returned</p>
              <p className="theme-muted-text">
                The live-check step ran, but neither store returned usable product data for the current priority ingredients. This usually means the scraper bridge is not configured yet or the scraper output shape does not match what the app expects.
              </p>
            </div>
          ) : null}

          <div className="theme-hero p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Priority Items</p>
                <p className="text-3xl font-black">{liveCheck?.priorityIngredients?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Live Matches</p>
                <p className="text-3xl font-black">
                  {liveCheck?.results?.filter((item) => item.hasAnyResult).length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-75">Cart Preview</p>
                <p className="text-3xl font-black">{money(liveCheck?.cartPreview?.highPriorityTotal || 0)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(liveCheck?.results || []).map((result) => (
              <article key={result.normalizedIngredient} className="theme-raised p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] theme-accent mb-2">Priority Ingredient</p>
                    <h2 className="text-3xl font-black capitalize theme-text">{result.ingredient}</h2>
                    <p className="theme-muted-text mt-2">{resultStatusText(result)}</p>
                  </div>
                  {result.selectedStore && (
                    <div className={`px-4 py-2 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#000] font-black ${storeBadgeClasses(result.selectedProduct?.storeSlug)}`}>
                      Best pick: {result.selectedStore}
                    </div>
                  )}
                </div>

                <div className="grid lg:grid-cols-2 gap-5">
                  {result.storeProducts.map((entry) => {
                    const product = entry.product;
                    const debug = entry.debug;
                    return (
                      <div
                        key={`${result.normalizedIngredient}-${entry.store}`}
                        className={`rounded-2xl border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] ${
                          product ? "bg-white" : "bg-[#F4EFE5]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-lg border-[3px] border-black font-black text-xs uppercase tracking-[0.15em] ${storeBadgeClasses(entry.storeSlug)}`}>
                            {entry.store}
                          </span>
                          {product?.deliveryTime && (
                            <span className="text-xs font-bold uppercase tracking-widest theme-muted-text">
                              {product.deliveryTime}
                            </span>
                          )}
                        </div>

                        {product ? (
                          <div className="grid grid-cols-[92px_1fr] gap-4 items-start">
                            <div className="aspect-square rounded-xl border-[3px] border-black bg-[#F8F4EC] overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase px-2 text-center">
                                  No image
                                </div>
                              )}
                            </div>

                            <div>
                              <a
                                href={product.productUrl || undefined}
                                target={product.productUrl ? "_blank" : undefined}
                                rel={product.productUrl ? "noreferrer" : undefined}
                                className="text-xl font-black leading-tight theme-text underline decoration-[3px] underline-offset-4"
                              >
                                {product.productName}
                              </a>
                              <div className="flex flex-wrap gap-3 mt-4">
                                <div className="theme-muted px-3 py-2 min-w-[110px]">
                                  <p className="text-[10px] uppercase tracking-widest font-black mb-1">Quantity</p>
                                  <p className="font-black text-base">{product.quantity || "Not listed"}</p>
                                </div>
                                <div className="theme-muted px-3 py-2 min-w-[110px]">
                                  <p className="text-[10px] uppercase tracking-widest font-black mb-1">Price</p>
                                  <p className="font-black text-base">{money(product.price)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="min-h-[130px] flex items-center justify-center text-center">
                            <div className="space-y-3">
                              <p className="theme-muted-text font-semibold">
                                No strong live match found on {entry.store} for this ingredient yet.
                              </p>
                              {debug?.status && (
                                <div className="text-[12px] font-black uppercase tracking-[0.15em] theme-muted-text">
                                  Status: {debug.status}
                                </div>
                              )}
                              {debug?.message && (
                                <pre className="text-left text-xs whitespace-pre-wrap bg-white/70 border-[2px] border-black rounded-lg p-3 max-h-40 overflow-auto">
                                  {debug.message}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          {!liveCheck?.results?.length && (
            <div className="theme-raised p-8 text-center">
              <p className="theme-muted-text text-lg">
                None of the selected meal ingredients matched the priority live-check list yet, so the cart will use the existing pricing flow.
              </p>
            </div>
          )}

          <div className="theme-raised p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest theme-muted-text mb-2">Next Step</p>
              <h3 className="text-2xl font-black theme-text">Use these matches and continue to the optimized cart</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="btn-secondary" onClick={() => navigate("/meals")}>
                Back to Meals
              </button>
              <button className="btn-primary" onClick={continueToCart}>
                Continue to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
