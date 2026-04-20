import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    preferences: user.preferences || {},
    onboardingCompleted: Boolean(user.onboardingCompleted),
  };
}

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: "15m" });
}

function signRefreshToken(userId) {
  return jwt.sign({ id: userId, type: "refresh" }, env.jwtRefreshSecret, { expiresIn: "7d" });
}

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password });
    const token = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    user.refreshTokens = [refreshToken];
    await user.save();
    return res.status(201).json({
      token,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshTokens");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
    await user.save();
    return res.status(200).json({
      token,
      refreshToken,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    if (payload.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const user = await User.findById(payload.id).select("+refreshTokens");
    if (!user || !(user.refreshTokens || []).includes(refreshToken)) {
      return res.status(401).json({ message: "Refresh token not recognized" });
    }
    const nextAccessToken = signAccessToken(user._id);
    const nextRefreshToken = signRefreshToken(user._id);
    user.refreshTokens = (user.refreshTokens || [])
      .filter((t) => t !== refreshToken)
      .concat(nextRefreshToken)
      .slice(-5);
    await user.save();
    return res.status(200).json({ token: nextAccessToken, refreshToken: nextRefreshToken });
  } catch (error) {
    return res.status(401).json({ message: "Could not refresh session" });
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(payload.id).select("+refreshTokens");
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t !== refreshToken);
      await user.save();
    }
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(200).json({ message: "Logged out" });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function updatePreferences(req, res) {
  try {
    const { name, ...preferences } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    user.preferences = {
      ...(user.preferences?.toObject?.() || user.preferences || {}),
      ...preferences,
    };
    user.onboardingCompleted = true;
    await user.save();

    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
