import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { eventsApi } from "../api/events.js";
import { useAuth } from "../context/AuthContext.jsx";
import { RSVP_OPTIONS } from "../lib/rsvp.js";
import Layout from "../components/Layout.jsx";
import Avatar from "../components/Avatar.jsx";
import RsvpButtons from "../components/RsvpButtons.jsx";
import EventForm from "../components/EventForm.jsx";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventsApi
      .get(id)
      .then(({ event }) => !cancelled && setEvent(event))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleRsvp(status) {
    const { event } = await eventsApi.rsvp(id, status);
    setEvent(event);
  }

  async function handleEdit(data) {
    const { event } = await eventsApi.update(id, data);
    setEvent(event);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this event?")) return;
    await eventsApi.remove(id);
    navigate("/events");
  }

  if (loading)
    return (
      <Layout>
        <p className="py-10 text-center text-muted">Loading…</p>
      </Layout>
    );

  if (error || !event)
    return (
      <Layout>
        <p className="py-10 text-center text-red-600">
          {error || "Event not found."}
        </p>
        <p className="text-center">
          <Link to="/events" className="font-bold text-sage-600 hover:underline">
            ← Back to events
          </Link>
        </p>
      </Layout>
    );

  const isHost = String(event.host?._id) === String(user._id);
  const canDelete = isHost || ["moderator", "admin"].includes(user.role);
  const start = new Date(event.startTime);
  const end = event.endTime ? new Date(event.endTime) : null;

  return (
    <Layout>
      <Link
        to="/events"
        className="mb-3 inline-block text-sm font-bold text-sage-600 hover:underline"
      >
        ← Back to events
      </Link>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold">{event.title}</h1>
          {(isHost || canDelete) && (
            <div className="flex shrink-0 gap-1">
              {isHost && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full px-3 py-1.5 text-sm font-bold text-muted transition hover:bg-black/5 hover:text-ink"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="rounded-full px-3 py-1.5 text-sm font-bold text-muted transition hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-[15px]">
          <p className="flex items-center gap-2">
            <span>🗓️</span>
            <span className="font-semibold">
              {format(start, "EEEE, MMMM d · h:mm a")}
              {end ? ` – ${format(end, "h:mm a")}` : ""}
            </span>
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <span>📍</span>
              <span>{event.location}</span>
            </p>
          )}
          <p className="flex items-center gap-2 text-muted">
            <span>👤</span>
            <span>Hosted by {event.host?.displayName || "Someone"}</span>
          </p>
        </div>

        {event.description && (
          <p className="mt-4 whitespace-pre-wrap border-t border-black/5 pt-4 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="mt-5 border-t border-black/5 pt-4">
          <p className="mb-2 text-sm font-bold text-muted">Will you go?</p>
          <RsvpButtons rsvps={event.rsvps} onRsvp={handleRsvp} />
        </div>
      </div>

      {/* Attendee list grouped by RSVP status */}
      <div className="mt-4 space-y-3">
        {RSVP_OPTIONS.map((o) => {
          const people = event.rsvps.filter((r) => r.status === o.status);
          if (people.length === 0) return null;
          return (
            <div key={o.status} className="card p-4">
              <p className="mb-2 text-sm font-bold">
                {o.emoji} {o.label}{" "}
                <span className="text-muted">({people.length})</span>
              </p>
              <ul className="flex flex-wrap gap-3">
                {people.map((r) => (
                  <li
                    key={String(r.user?._id || r.user)}
                    className="flex items-center gap-2"
                  >
                    <Avatar user={r.user} size={28} />
                    <span className="text-sm font-semibold">
                      {r.user?.displayName || "Someone"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {editing && (
        <EventForm
          initial={event}
          onSubmit={handleEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </Layout>
  );
}
