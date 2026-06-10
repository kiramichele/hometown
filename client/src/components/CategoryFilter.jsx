import { CATEGORIES } from "../lib/categories.js";

// Horizontal filter pills above the feed. "All" plus one per category.
const TABS = [{ key: "all", label: "All", emoji: "🏘️" }, ...CATEGORIES];

export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
              active
                ? "bg-ink text-cream"
                : "border border-black/10 bg-white text-muted hover:border-black/20 hover:text-ink"
            }`}
          >
            <span className="mr-1">{t.emoji}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
