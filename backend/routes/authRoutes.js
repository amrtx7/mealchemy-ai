import express from "express";
import { login, logout, refresh, signup } from "../controllers/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema, refreshSchema, signupSchema } from "../validation/schemas.js";

const router = express.Router();

router.post("/signup", validateRequest(signupSchema), signup);
router.post("/login", validateRequest(loginSchema), login);
router.post("/refresh", validateRequest(refreshSchema), refresh);
router.post("/logout", validateRequest(refreshSchema), logout);

export default router;
