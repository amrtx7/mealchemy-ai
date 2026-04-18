import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, default: 250, min: 1 },
    unit: { type: String, enum: ["g", "mg", "ml", "pc", "doz", "tabs", "caps", "sachet"], default: "g" },
    price: { type: Number, required: true, min: 0 },
    store: { type: String, required: true, trim: true },
    productName: { type: String, trim: true, default: "" },
    packageLabel: { type: String, trim: true, default: "" },
    available: { type: Boolean, default: true },
    unavailableReason: { type: String, trim: true, default: "" },
    priority: { type: String, enum: ["high", "optional"], default: "high" },
    priorityLabel: { type: String, trim: true, default: "High priority" },
    reason: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const mealSchema = new mongoose.Schema(
  {
    meal: { type: String, required: true, trim: true },
    cuisine: { type: String, trim: true, default: "" },
    mealType: { type: String, trim: true, default: "" },
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
      cuisine: { type: String, default: "" },
      mealType: { type: String, default: "" },
      diet: { type: String, default: "" },
      protein: { type: Boolean, default: false },
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
