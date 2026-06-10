import { useAuth } from "../context/AuthContext.jsx";
import { REACTIONS } from "../lib/reactions.js";

// Slack-style reaction row. Each type shows a count and highlights if the
// current user has left that reaction. Clicking toggles it.
export default function ReactionBar({ reactions = [], onToggle }) {
  const { user } = useAuth();
  const uid = String(user._id);

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTIONS.map((r) => {
        const mine = reactions.some(
          (x) => x.type === r.type && String(x.user) === uid
        );
        const count = reactions.filter((x) => x.type === r.type).length;
        return (
          <button
            key={r.type}
            onClick={() => onToggle(r.type)}
            title={r.label}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
              mine
                ? "border-sage-200 bg-sage-50 text-sage-700"
                : "border-transparent text-muted hover:bg-black/5"
            }`}
          >
            <span>{r.emoji}</span>
            {count > 0 && <span className="font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
