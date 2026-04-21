import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const preferencesSchema = z.object({
  name: z.string().trim().min(2).optional(),
  age: z.number().int().min(1).max(120).nullable().optional(),
  height: z.number().min(1).max(300).nullable().optional(),
  weight: z.number().min(1).max(500).nullable().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  goal: z.enum(["maintain_weight", "lose_weight", "build_muscle", "eat_healthy", "save_money", "quick_meals"]).optional(),
  diet: z.enum(["veg", "non-veg", "vegan", "eggetarian", "no_restriction"]).optional(),
  cuisine: z.array(z.string().trim().min(1)).optional(),
  budget: z.number().min(0).nullable().optional(),
  protein: z.enum(["high", "moderate", "low"]).optional(),
  cookingTime: z.enum(["15min", "30min", "60min", "no_constraint"]).optional(),
  allergies: z.array(z.string().trim().min(1)).optional(),
});

export const generateMealsSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
  cuisine: z.string().optional(),
  mealType: z.string().optional(),
  diet: z.string().optional(),
  budget: z.number().nullable().optional(),
  protein: z.boolean().optional(),
});

export const saveMealPlanSchema = z.object({
  query: z.string().trim().min(5),
  constraints: z
    .object({
      budget: z.number().nullable().optional(),
      cuisine: z.string().optional(),
      mealType: z.string().optional(),
      diet: z.string().optional(),
      protein: z.boolean().optional(),
      servings: z.number().optional(),
      dietType: z.string().optional(),
    })
    .optional(),
  meals: z
    .array(
      z.object({
        meal: z.string().min(1),
        mealName: z.string().optional(),
        cuisine: z.string().optional(),
        mealType: z.string().optional(),
        estimatedCost: z.number().optional(),
        proteinLevel: z.string().optional(),
        cookingTime: z.string().optional(),
        ingredients: z.array(z.string().min(1)),
      })
    )
    .min(1),
  cart: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().min(1),
        unit: z.enum(["g", "mg", "ml", "pc", "doz", "tabs", "caps", "sachet"]),
        price: z.number().min(0),
        store: z.string(),
        productName: z.string().optional(),
        packageLabel: z.string().optional(),
        imageUrl: z.string().optional(),
        productUrl: z.string().optional(),
        deliveryTime: z.string().optional(),
        source: z.string().optional(),
        storeSlug: z.string().optional(),
        available: z.boolean().optional(),
        unavailableReason: z.string().optional(),
        priority: z.enum(["high", "optional"]).optional(),
        priorityLabel: z.string().optional(),
        reason: z.string().optional(),
      })
    )
    .optional(),
  totalCost: z.number().min(0).optional(),
});

export const getIngredientsSchema = z.object({
  dishes: z.array(z.string().min(1)).min(1),
  constraints: z.record(z.string(), z.any()).optional(),
});

export const optimizeCartSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  meals: z
    .array(
      z.object({
        meal: z.string().min(1),
        mealName: z.string().optional(),
        cuisine: z.string().optional(),
        mealType: z.string().optional(),
        estimatedCost: z.number().optional(),
        proteinLevel: z.string().optional(),
        cookingTime: z.string().optional(),
        ingredients: z.array(z.string().min(1)).optional(),
      })
    )
    .optional(),
  constraints: z
    .object({
      budget: z.number().nullable().optional(),
      servings: z.number().optional(),
      dietType: z.string().optional(),
    })
    .optional(),
});

export const liveCheckSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  meals: z
    .array(
      z.object({
        meal: z.string().min(1),
        mealName: z.string().optional(),
        cuisine: z.string().optional(),
        mealType: z.string().optional(),
        estimatedCost: z.number().optional(),
        proteinLevel: z.string().optional(),
        cookingTime: z.string().optional(),
        ingredients: z.array(z.string().min(1)).optional(),
      })
    )
    .optional(),
  constraints: z.record(z.string(), z.any()).optional(),
  pincode: z.string().min(4).max(10).optional(),
});
