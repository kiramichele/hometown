import { useAuth } from "../context/AuthContext.jsx";
import { RSVP_OPTIONS } from "../lib/rsvp.js";

// Going / Maybe / Can't go. Highlights the current user's choice and shows a
// count per option. Clicking the active one toggles it off (server handles it).
export default function RsvpButtons({ rsvps = [], onRsvp }) {
  const { user } = useAuth();
  const uid = String(user._id);
  const mine = rsvps.find((r) => String(r.user?._id || r.user) === uid);

  return (
    <div className="flex flex-wrap gap-2">
      {RSVP_OPTIONS.map((o) => {
        const active = mine?.status === o.status;
        const count = rsvps.filter((r) => r.status === o.status).length;
        return (
          <button
            key={o.status}
            onClick={() => onRsvp(o.status)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition ${
              active
                ? "border-sage-500 bg-sage-500 text-white"
                : "border-black/10 bg-white text-ink hover:border-black/25"
            }`}
          >
            <span>{o.emoji}</span>
            {o.label}
            {count > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1.5 text-xs ${
                  active ? "bg-white/25" : "bg-black/5"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
