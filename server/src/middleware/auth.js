import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the JWT from the Authorization header and attaches the full user
// document to req.user. This is the gate every protected route passes through.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// The hand-rolled equivalent of a Supabase RLS policy. Confirms the resource's
// neighborhood matches the logged-in user's. Pass a function that pulls the
// neighborhood id off whatever resource the route just loaded.
//
//   router.get("/:id", requireAuth, loadPost,
//     requireSameNeighborhood((req) => req.post.neighborhood), handler)
//
// For list/create routes you usually just filter/stamp by req.user.neighborhood
// directly instead of using this — it's for single-resource reads/writes.
export function requireSameNeighborhood(getResourceNeighborhood) {
  return (req, res, next) => {
    const resourceHood = String(getResourceNeighborhood(req));
    const userHood = String(req.user.neighborhood);
    if (resourceHood !== userHood) {
      return res.status(403).json({ error: "Not in your neighborhood" });
    }
    next();
  };
}

// Role gate for moderator/admin-only routes (used heavily in Phase 6 & 8).
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
