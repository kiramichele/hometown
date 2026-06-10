// RSVP option metadata shared by the RSVP buttons and the attendee list.
// Mirrors RSVP_STATUSES on the server (server/src/models/Event.js).
export const RSVP_OPTIONS = [
  { status: "going", label: "Going", emoji: "✅", chip: "bg-sage-100 text-sage-700" },
  { status: "maybe", label: "Maybe", emoji: "🤔", chip: "bg-amber-100 text-amber-800" },
  { status: "no", label: "Can't go", emoji: "🚫", chip: "bg-slate-100 text-slate-600" },
];

export const RSVP_MAP = Object.fromEntries(
  RSVP_OPTIONS.map((o) => [o.status, o])
);
