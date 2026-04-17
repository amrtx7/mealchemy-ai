import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import MealPlan from "../models/MealPlan.js";

dotenv.config();

async function run() {
  await connectDB();

  let user = await User.findOne({ email: "demo@meal.app" }).select("+password");
  if (!user) {
    user = await User.create({
      name: "Demo User",
      email: "demo@meal.app",
      password: "password123",
    });
  }

  const exists = await MealPlan.findOne({ userId: user._id });
  if (!exists) {
    await MealPlan.create({
      userId: user._id,
      query: "vegetarian meals under 500 for 2 people",
      constraints: { budget: 500, dietType: "vegetarian", servings: 2 },
      meals: [
        { meal: "Vegetable Rice Bowl", ingredients: ["rice", "onion", "tomato"] },
        { meal: "Paneer Stir Fry", ingredients: ["paneer", "onion", "tomato"] },
      ],
      cart: [
        { name: "rice", amount: 500, unit: "g", price: 31, store: "JioMart" },
        { name: "paneer", amount: 250, unit: "g", price: 23, store: "BigBasket" },
        { name: "tomato", amount: 500, unit: "g", price: 16, store: "JioMart" },
      ],
      totalCost: 70,
    });
  }

  console.log("Seed complete. Demo login: demo@meal.app / password123");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
