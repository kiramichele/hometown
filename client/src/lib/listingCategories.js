// Marketplace category metadata. Mirrors LISTING_CATEGORIES on the server
// (server/src/models/Listing.js).
export const LISTING_CATEGORIES = [
  { key: "furniture", label: "Furniture", emoji: "🛋️" },
  { key: "electronics", label: "Electronics", emoji: "📱" },
  { key: "household", label: "Household", emoji: "🏠" },
  { key: "tools", label: "Tools", emoji: "🔧" },
  { key: "kids", label: "Kids", emoji: "🧸" },
  { key: "clothing", label: "Clothing", emoji: "👕" },
  { key: "free", label: "Free", emoji: "🎁" },
  { key: "other", label: "Other", emoji: "📦" },
];

export const LISTING_CATEGORY_MAP = Object.fromEntries(
  LISTING_CATEGORIES.map((c) => [c.key, c])
);

// "Free" for 0, otherwise a whole-dollar price.
export function formatPrice(price) {
  return price === 0 ? "Free" : `$${price}`;
}
