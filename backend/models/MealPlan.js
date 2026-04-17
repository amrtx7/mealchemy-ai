import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, default: 250, min: 1 },
    unit: { type: String, enum: ["g", "mg"], default: "g" },
    price: { type: Number, required: true, min: 0 },
    store: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    meal: { type: String, required: true, trim: true },
    ingredients: [{ type: String, required: true, trim: true }],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    query: { type: String, required: true, trim: true },
    constraints: {
      budget: { type: Number, default: null },
      dietType: { type: String, default: "" },
      servings: { type: Number, default: 1 },
    },
    meals: [mealSchema],
    cart: [cartItemSchema],
    totalCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("MealPlan", mealPlanSchema);
