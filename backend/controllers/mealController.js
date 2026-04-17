import MealPlan from "../models/MealPlan.js";
import { generateMeals } from "../services/aiService.js";
import { parseConstraints } from "../services/parserService.js";
import { optimizeCart } from "../services/optimizationService.js";

export async function generateMealPlan(req, res) {
  try {
    const { query, cuisine, mealType, diet, budget, protein } = req.body;

    const constraints = { budget, cuisine, mealType, diet, protein };
    
    const userQuery = { query, cuisine, mealType, diet, budget, protein };
    const meals = await generateMeals(userQuery, { min: 4, max: 4 });

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
    const [today, recent] = await Promise.all([
      MealPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 }),
      MealPlan.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5),
    ]);
    return res.status(200).json({ todayMealPlan: today, recentMeals: recent });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

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