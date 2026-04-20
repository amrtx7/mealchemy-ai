import express from "express";
import { login, logout, me, refresh, signup, updatePreferences } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema, preferencesSchema, refreshSchema, signupSchema } from "../validation/schemas.js";

const router = express.Router();

router.post("/signup", validateRequest(signupSchema), signup);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh", validateRequest(refreshSchema), refresh);
router.post("/logout", validateRequest(refreshSchema), logout);
router.get("/me", requireAuth, me);
router.put("/preferences", requireAuth, validateRequest(preferencesSchema), updatePreferences);

export default router;
