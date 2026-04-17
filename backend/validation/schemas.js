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

export const generateMealsSchema = z.object({
  query: z.string().trim().min(5),
});

export const saveMealPlanSchema = z.object({
  query: z.string().trim().min(5),
  constraints: z
    .object({
      budget: z.number().nullable().optional(),
      servings: z.number().optional(),
      dietType: z.string().optional(),
    })
    .optional(),
  meals: z
    .array(
      z.object({
        meal: z.string().min(1),
        ingredients: z.array(z.string().min(1)),
      })
    )
    .min(1),
  cart: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().min(1),
        unit: z.enum(["g", "mg"]),
        price: z.number().min(0),
        store: z.string(),
      })
    )
    .optional(),
  totalCost: z.number().min(0).optional(),
});

export const optimizeCartSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  constraints: z
    .object({
      budget: z.number().nullable().optional(),
      servings: z.number().optional(),
      dietType: z.string().optional(),
    })
    .optional(),
});
