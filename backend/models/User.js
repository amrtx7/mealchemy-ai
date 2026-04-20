import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const preferencesSchema = new mongoose.Schema(
  {
    age: { type: Number, min: 1, max: 120, default: null },
    height: { type: Number, min: 1, max: 300, default: null },
    weight: { type: Number, min: 1, max: 500, default: null },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say", ""], default: "" },
    goal: { type: String, default: "" },
    diet: { type: String, default: "" },
    cuisine: [{ type: String, trim: true }],
    budget: { type: Number, default: null },
    protein: { type: String, enum: ["high", "moderate", "low", ""], default: "" },
    cookingTime: { type: String, default: "" },
    allergies: [{ type: String, trim: true }],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    preferences: { type: preferencesSchema, default: () => ({}) },
    onboardingCompleted: { type: Boolean, default: false },
    refreshTokens: [{ type: String, select: false }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function onSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
