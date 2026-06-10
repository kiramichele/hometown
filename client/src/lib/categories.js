// Category metadata shared by the compose box, filter tabs, and post badges.
// Mirrors POST_CATEGORIES on the server (server/src/models/Post.js).
export const CATEGORIES = [
  {
    key: "general",
    label: "General",
    emoji: "💬",
    badge: "bg-slate-100 text-slate-700",
  },
  {
    key: "recommendation",
    label: "Recommendation",
    emoji: "⭐",
    badge: "bg-sage-100 text-sage-700",
  },
  {
    key: "alert",
    label: "Alert",
    emoji: "⚠️",
    badge: "bg-amber-100 text-amber-800",
  },
  {
    key: "forsale",
    label: "For Sale",
    emoji: "🏷️",
    badge: "bg-sky-100 text-sky-800",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
);
