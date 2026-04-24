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
    imageUrl: { type: String, trim: true, default: "" },
    productUrl: { type: String, trim: true, default: "" },
    deliveryTime: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "" },
    storeSlug: { type: String, trim: true, default: "" },
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
    mealName: { type: String, trim: true, default: "" },
    cuisine: { type: String, trim: true, default: "" },
    mealType: { type: String, trim: true, default: "" },
    estimatedCost: { type: Number, default: 0 },
    proteinLevel: { type: String, trim: true, default: "" },
    cookingTime: { type: String, trim: true, default: "" },
    ingredients: [{ type: String, required: true, trim: true }],
    recipe: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    query: { type: String, required: true, trim: true },
    constraints: { type: mongoose.Schema.Types.Mixed, default: {} },
    meals: [mealSchema],
    cart: [cartItemSchema],
    totalCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("MealPlan", mealPlanSchema);
