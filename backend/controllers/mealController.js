import MealPlan from "../models/MealPlan.js";
import User from "../models/User.js";
import { generateMeals } from "../services/aiService.js";
import { generateText, isAiConfigured } from "../services/aiProviderService.js";
import { mergeMealConstraints, parseMealQuery } from "../services/parserService.js";
import { optimizeCart } from "../services/optimizationService.js";
import { convertDishesToIngredients, mergeIngredients } from "../services/ingredientService.js";
import { buildLiveComparison } from "../services/livePricingService.js";

export async function generateMealPlan(req, res) {
  try {
    const { query } = req.body;
    const user = await User.findById(req.user.id);
    const queryOverrides = parseMealQuery(query);
    const constraints = mergeMealConstraints({
      userPreferences: user?.preferences || {},
      queryOverrides,
      requestBody: req.body,
    });

    const meals = await generateMeals(query, constraints, { min: 4, max: 4 });

    return res.status(200).json({ query, constraints, meals, cart: [], totalCost: 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


export async function saveMealPlan(req, res) {
  try {
    const { query, constraints, meals, cart, totalCost } = req.body;
    console.log("[SaveMealPlan] request received", {
      userId: req.user?.id,
      query,
      mealsCount: Array.isArray(meals) ? meals.length : -1,
      cartCount: Array.isArray(cart) ? cart.length : -1,
      totalCost,
      constraintKeys: Object.keys(constraints || {}),
    });
    if (!query || !Array.isArray(meals) || meals.length === 0) {
      console.warn("[SaveMealPlan] invalid request: query/meals missing");
      return res.status(400).json({ message: "query and meals are required" });
    }
    const saved = await MealPlan.create({
      userId: req.user.id,
      query,
      constraints: constraints || {},
      meals,
      cart: cart || [],
      totalCost: totalCost || 0,
    });
    console.log("[SaveMealPlan] saved", {
      id: saved?._id?.toString?.(),
      mealsCount: saved?.meals?.length || 0,
      cartCount: saved?.cart?.length || 0,
    });
    return res.status(201).json(saved);
  } catch (error) {
    console.error("[SaveMealPlan] failed", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    return res.status(500).json({ message: error.message });
  }
}

export async function getHistory(req, res) {
  try {
    const items = await MealPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMealPlanById(req, res) {
  try {
    const { id } = req.params;
    const plan = await MealPlan.findOne({ _id: id, userId: req.user.id });
    if (!plan) return res.status(404).json({ message: "Meal plan not found" });
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function generateRecipesForMealPlan(req, res) {
  try {
    const { id } = req.params;
    const plan = await MealPlan.findOne({ _id: id, userId: req.user.id });
    if (!plan) return res.status(404).json({ message: "Meal plan not found" });

    if (!isAiConfigured()) {
      return res.status(400).json({ message: "AI is not configured. Set AI_API_KEY to generate recipes." });
    }

    const meals = Array.isArray(plan.meals) ? plan.meals : [];
    const nextMeals = [];

    for (const meal of meals) {
      if (meal?.recipe) {
        nextMeals.push(meal);
        continue;
      }

      const title = meal?.mealName || meal?.meal || "Meal";
      const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients : [];
      const cuisine = meal?.cuisine || "";
      const mealType = meal?.mealType || "";

      const prompt = `Create a practical home-cooking recipe for the dish below.

Dish: ${title}
Cuisine: ${cuisine || "unspecified"}
Meal type: ${mealType || "unspecified"}
Ingredients: ${ingredients.length ? ingredients.join(", ") : "unspecified"}

Rules:
- Use only common kitchen steps and quantities (cups, tbsp, tsp, grams)
- Keep it concise and beginner-friendly
- Prefer 6 to 9 steps max; each step should be 1 sentence when possible
- Avoid long explanations; make it scannable
- Output STRICT JSON only (no markdown), in this shape:
{
  "servings": 2,
  "prepTime": "10 min",
  "cookTime": "20 min",
  "steps": ["..."],
  "tips": ["..."]
}`;

      const response = await generateText(prompt);
      const raw = String(response.text || "").trim();
      const cleaned = raw.replace(/```json|```/gi, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonText = start !== -1 && end !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      const recipe = JSON.parse(jsonText);

      nextMeals.push({ ...(meal.toObject ? meal.toObject() : meal), recipe });
    }

    plan.meals = nextMeals;
    await plan.save();
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getDashboard(req, res) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [user, today, plans] = await Promise.all([
      User.findById(req.user.id).select("name email"),
      MealPlan.findOne({ userId: req.user.id, createdAt: { $gte: startOfToday } }).sort({ createdAt: -1 }),
      MealPlan.find({ userId: req.user.id, createdAt: { $gte: startOfYear } })
        .sort({ createdAt: -1 })
        .limit(250),
    ]);

    return res.status(200).json({
      user: user ? { id: user._id, name: user.name, email: user.email } : null,
      todayMealPlan: today,
      plans,
      recentMeals: plans.slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * POST /meal/ingredients
 * Input: { dishes: ["Paneer Paratha", "Vada"] }
 * Output: { ingredientsByDish: {...}, ingredients: ["atta", "paneer", ...] }
 */
export async function getIngredients(req, res) {
  try {
    const { dishes } = req.body;
    if (!Array.isArray(dishes) || dishes.length === 0) {
      return res.status(400).json({ message: "dishes array is required" });
    }
    const user = await User.findById(req.user.id);
    const constraints = req.body.constraints || user?.preferences || {};
    const ingredientsByDish = await convertDishesToIngredients(dishes, constraints);
    const ingredients = mergeIngredients(ingredientsByDish, constraints);
    return res.status(200).json({ ingredientsByDish, ingredients });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * POST /cart/optimize
 * Input: { ingredients: ["atta", "paneer"], constraints: {} }
 * Output: { cartItems, totalCost, withinBudget }
 */
export async function optimizeCartFromMeals(req, res) {
  try {
    const ingredients = req.body.ingredients || [];
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: "ingredients array is required" });
    }
    const result = optimizeCart(ingredients, req.body.constraints || {}, {
      meals: req.body.meals || [],
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function liveCheckIngredients(req, res) {
  try {
    console.log("[LiveCheckRoute] request received -> using scraper debug build");
    const result = await buildLiveComparison(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export function show(req, res) {
  res.status(200).json({ message: "AI Meal Planner API is live" });
}
