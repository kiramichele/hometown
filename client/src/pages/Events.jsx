import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  format,
} from "date-fns";
import { eventsApi } from "../api/events.js";
import Layout from "../components/Layout.jsx";
import CalendarGrid from "../components/CalendarGrid.jsx";
import EventForm from "../components/EventForm.jsx";

export default function Events() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState("calendar"); // "calendar" | "list"
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Fetch every event visible in the current month's grid (which spills a few
  // days into the neighbouring months).
  useEffect(() => {
    const start = startOfWeek(startOfMonth(month)).toISOString();
    const end = endOfWeek(endOfMonth(month)).toISOString();
    let cancelled = false;
    setLoading(true);
    setError("");
    eventsApi
      .calendar(start, end)
      .then(({ events }) => !cancelled && setEvents(events))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  async function handleCreate(data) {
    const { event } = await eventsApi.create(data);
    setShowForm(false);
    // Jump to the created event's month so it's visible, then open it.
    setMonth(new Date(event.startTime));
    navigate(`/events/${event._id}`);
  }

  const monthEvents = [...events].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );

  return (
    <Layout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-full px-3 py-1.5 text-lg font-bold text-muted transition hover:bg-black/5"
          >
            ‹
          </button>
          <h2 className="min-w-[10rem] text-center text-lg font-extrabold">
            {format(month, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-full px-3 py-1.5 text-lg font-bold text-muted transition hover:bg-black/5"
          >
            ›
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="ml-1 rounded-full border border-black/10 px-3 py-1 text-sm font-bold text-muted transition hover:border-black/25 hover:text-ink"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-black/5 p-0.5 text-sm font-bold">
            {["calendar", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1 capitalize transition ${
                  view === v ? "bg-white text-ink shadow-sm" : "text-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + New event
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-muted">Loading events…</p>
      ) : error ? (
        <p className="py-10 text-center text-red-600">{error}</p>
      ) : view === "calendar" ? (
        <CalendarGrid
          month={month}
          events={monthEvents}
          onSelectEvent={(e) => navigate(`/events/${e._id}`)}
        />
      ) : monthEvents.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          <p className="text-2xl">📅</p>
          <p className="mt-2 font-semibold">No events this month</p>
          <p className="text-sm">Be the first to plan something.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {monthEvents.map((e) => (
            <li key={e._id}>
              <button
                onClick={() => navigate(`/events/${e._id}`)}
                className="card flex w-full items-center gap-4 p-4 text-left transition hover:shadow-md"
              >
                <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-sage-50 py-1.5 text-sage-700">
                  <span className="text-xs font-bold uppercase">
                    {format(new Date(e.startTime), "MMM")}
                  </span>
                  <span className="text-xl font-extrabold leading-none">
                    {format(new Date(e.startTime), "d")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.title}</p>
                  <p className="truncate text-sm text-muted">
                    {format(new Date(e.startTime), "EEE, h:mm a")}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-bold text-sage-700">
                  {e.rsvps.filter((r) => r.status === "going").length} going
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <EventForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}
    </Layout>
  );
}
