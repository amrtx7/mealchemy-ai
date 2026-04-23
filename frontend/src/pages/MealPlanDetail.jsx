import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function isRecipeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function RecipeCard({ recipe }) {
  if (!recipe) return null;
  if (typeof recipe === "string") {
    return <pre className="whitespace-pre-wrap text-sm">{recipe}</pre>;
  }

  if (!isRecipeObject(recipe)) {
    return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(recipe, null, 2)}</pre>;
  }

  const servings = recipe.servings;
  const prepTime = recipe.prepTime;
  const cookTime = recipe.cookTime;
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  const tips = Array.isArray(recipe.tips) ? recipe.tips : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {typeof servings !== "undefined" && servings !== null && (
          <span className="px-3 py-1 theme-muted text-xs font-black rounded-md shadow-neo-sm">
            Servings: {servings}
          </span>
        )}
        {prepTime && (
          <span className="px-3 py-1 theme-muted text-xs font-black rounded-md shadow-neo-sm">
            Prep: {prepTime}
          </span>
        )}
        {cookTime && (
          <span className="px-3 py-1 theme-muted text-xs font-black rounded-md shadow-neo-sm">
            Cook: {cookTime}
          </span>
        )}
      </div>

      {steps.length > 0 ? (
        <ol className="list-decimal pl-5 space-y-2 text-sm theme-text">
          {steps.map((step, idx) => (
            <li key={idx} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      ) : (
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(recipe, null, 2)}</pre>
      )}

      {tips.length > 0 && (
        <details className="theme-muted p-4">
          <summary className="cursor-pointer font-black theme-text">Tips</summary>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-sm theme-text">
            {tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function renderRecipe(recipe) {
  if (!recipe) return null;
  return <RecipeCard recipe={recipe} />;
}

export default function MealPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const { data } = await api.get(`/meals/${id}`);
        setPlan(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load meal plan.");
      }
    }
    load();
  }, [id]);

  const recipeMeals = useMemo(() => (plan?.meals || []).filter((meal) => meal?.recipe), [plan]);

  const generateRecipes = async () => {
    setGenerating(true);
    setError("");
    try {
      const { data } = await api.post(`/meals/${id}/recipes`, {});
      setPlan(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to generate recipes.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto my-10 px-6 space-y-8">
      <div className="theme-raised p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] theme-accent mb-3">Saved Plan</p>
            <h1 className="text-3xl md:text-5xl font-black theme-text">
              {plan?.query || "Meal Plan"}
            </h1>
            {plan?.createdAt && (
              <p className="theme-muted-text mt-3">
                {formatDate(plan.createdAt)} · ₹{plan.totalCost || 0}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary" onClick={() => navigate("/history")}>
              Back
            </button>
            <button className="btn-primary" onClick={() => navigate("/cart")}>
              Open Cart
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="theme-raised p-4 text-center" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {plan && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="theme-raised p-6 md:p-8 space-y-6">
            <h2 className="text-3xl font-black theme-text">Meals</h2>
            {(plan.meals || []).map((meal, idx) => (
              <article key={`${meal.meal}-${idx}`} className="theme-muted p-5">
                <h3 className="text-2xl font-black theme-text">{meal.meal}</h3>
                {!!meal.ingredients?.length && (
                  <div className="mt-4">
                    <p className="text-xs font-black uppercase tracking-widest theme-muted-text mb-2">
                      Ingredients
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {meal.ingredients.map((it) => (
                        <span key={`${meal.meal}-${it}`} className="px-2.5 py-1 theme-raised text-xs font-black rounded-md shadow-neo-sm">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="theme-raised p-6 md:p-8 space-y-6">
            <h2 className="text-3xl font-black theme-text">Recipes</h2>
            {recipeMeals.length === 0 ? (
              <div className="theme-muted p-6">
                <p className="theme-muted-text">
                  No recipes were saved with this plan yet. (We’re now storing `meals[].recipe` when present.)
                </p>
                <button
                  className="btn-primary mt-5"
                  onClick={generateRecipes}
                  disabled={generating}
                >
                  {generating ? "Generating..." : "Generate Recipes"}
                </button>
              </div>
            ) : (
              recipeMeals.map((meal, idx) => (
                <article key={`${meal.meal}-recipe-${idx}`} className="theme-muted p-5">
                  <h3 className="text-2xl font-black theme-text mb-4">{meal.meal}</h3>
                  <div className="theme-raised p-4">{renderRecipe(meal.recipe)}</div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

