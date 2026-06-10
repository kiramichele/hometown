import { useState } from "react";
import { format } from "date-fns";

// Convert a stored ISO string to the value a datetime-local input expects
// (local time, no timezone suffix).
function toLocalInput(iso) {
  return iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : "";
}

// Modal form for creating or editing an event. `initial` (an event) puts it in
// edit mode. onSubmit receives a payload ready for the API.
export default function EventForm({ initial, onSubmit, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [start, setStart] = useState(toLocalInput(initial?.startTime));
  const [end, setEnd] = useState(toLocalInput(initial?.endTime));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return setError("Please give your event a title.");
    if (!start) return setError("Please pick a start time.");
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        startTime: new Date(start).toISOString(),
        endTime: end ? new Date(end).toISOString() : null,
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-extrabold">
          {initial ? "Edit event" : "New event"}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="input"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <input
            className="input"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-muted">
              Starts
              <input
                type="datetime-local"
                className="input mt-1"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-muted">
              Ends (optional)
              <input
                type="datetime-local"
                className="input mt-1"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <textarea
            className="input min-h-[84px] resize-none"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 font-semibold text-muted transition hover:bg-black/5"
            >
              Cancel
            </button>
            <button className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : initial ? "Save changes" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
