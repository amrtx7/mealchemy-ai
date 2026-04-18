import express from "express";
import {
  generateMealPlan,
  getDashboard,
  getHistory,
  getIngredients,
  optimizeCartFromMeals,
  saveMealPlan,
  show,
} from "../controllers/mealController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { generateMealsSchema, getIngredientsSchema, optimizeCartSchema, saveMealPlanSchema } from "../validation/schemas.js";

const router = express.Router();

router.get("/show", show);

router.post("/meals/generate", requireAuth, validateRequest(generateMealsSchema), generateMealPlan);
router.post("/meals/save", requireAuth, validateRequest(saveMealPlanSchema), saveMealPlan);
router.get("/meals/history", requireAuth, getHistory);
router.get("/meals/dashboard", requireAuth, getDashboard);
router.post("/meal/ingredients", requireAuth, validateRequest(getIngredientsSchema), getIngredients);
router.post("/cart/optimize", requireAuth, validateRequest(optimizeCartSchema), optimizeCartFromMeals);

// Backward-compatible aliases
router.post("/generate-meal", requireAuth, validateRequest(generateMealsSchema), generateMealPlan);
router.post("/generate-meals", requireAuth, validateRequest(generateMealsSchema), generateMealPlan);

export default router;