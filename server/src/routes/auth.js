import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Neighborhood from "../models/Neighborhood.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(user) {
  // "sub" (subject) is the conventional JWT claim for the user id.
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res
        .status(400)
        .json({ error: "email, password, displayName are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Single-neighborhood app: everyone joins the one seeded neighborhood.
    const neighborhood = await Neighborhood.findOne();
    if (!neighborhood) {
      return res
        .status(500)
        .json({ error: "No neighborhood exists — run the seed script" });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      displayName,
      neighborhood: neighborhood._id,
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me — used by the client on load to restore the session.
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
