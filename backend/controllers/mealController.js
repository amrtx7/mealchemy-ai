import MealPlan from "../models/MealPlan.js";
import User from "../models/User.js";
import { generateMeals } from "../services/aiService.js";
import { parseConstraints } from "../services/parserService.js";
import { optimizeCart } from "../services/optimizationService.js";
import { convertDishesToIngredients, mergeIngredients } from "../services/ingredientService.js";

export async function generateMealPlan(req, res) {
  try {
    const { query, cuisine, mealType, diet, budget, protein } = req.body;

    const constraints = { budget, cuisine, mealType, diet, protein };
    const filters = { cuisine, mealType, diet, budget, protein };

    const meals = await generateMeals(query, filters, { min: 4, max: 4 });

    return res.status(200).json({ query, constraints, meals, cart: [], totalCost: 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


export async function saveMealPlan(req, res) {
  try {
    const { query, constraints, meals, cart, totalCost } = req.body;
    if (!query || !Array.isArray(meals) || meals.length === 0) {
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
    return res.status(201).json(saved);
  } catch (error) {
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
    const ingredientsByDish = await convertDishesToIngredients(dishes);
    const ingredients = mergeIngredients(ingredientsByDish);
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
    const result = optimizeCart(ingredients, req.body.constraints || {});
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export function show(req, res) {
  res.status(200).json({ message: "AI Meal Planner API is live" });
}
