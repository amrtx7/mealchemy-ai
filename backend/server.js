import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { env, getAiConfigFingerprint, validateStartupEnv } from "./config/env.js";
import mealRoutes from "./routes/mealRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { buildLiveComparison } from "./services/livePricingService.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", mealRoutes);

if (process.env.NODE_ENV !== "production") {
  app.post("/api/debug/live-check", async (req, res) => {
    try {
      const payload = req.body && typeof req.body === "object" ? req.body : {};
      const result = await buildLiveComparison({
        ingredients: payload.ingredients || ["milk", "bread"],
        meals: payload.meals || [],
        constraints: payload.constraints || {},
        pincode: payload.pincode,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message, stack: error.stack });
    }
  });
}

app.get("/", (req, res) => {
  res.json({ message: "AI Meal Planner API running" });
});

async function startServer() {
  try {
    validateStartupEnv();
    await connectDB();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log("AI config:", getAiConfigFingerprint());
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});
