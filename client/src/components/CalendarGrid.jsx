import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A month grid. Shows leading/trailing days from adjacent months (greyed out),
// highlights today, and renders up to 3 event chips per day.
export default function CalendarGrid({ month, events, onSelectEvent }) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  // Bucket events by their day for O(1) lookup while rendering.
  const byDay = {};
  for (const e of events) {
    const key = format(new Date(e.startTime), "yyyy-MM-dd");
    (byDay[key] ||= []).push(e);
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-black/5 bg-black/[0.02] text-center text-xs font-bold uppercase tracking-wide text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDay[key] || [];
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              className={`min-h-[96px] border-b border-r border-black/5 p-1.5 ${
                inMonth ? "" : "bg-black/[0.015]"
              }`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold ${
                  isToday
                    ? "bg-sage-500 text-white"
                    : inMonth
                    ? "text-ink"
                    : "text-muted/60"
                }`}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={e._id}
                    onClick={() => onSelectEvent(e)}
                    title={e.title}
                    className="block w-full truncate rounded-md bg-sage-50 px-1.5 py-0.5 text-left text-xs font-semibold text-sage-700 transition hover:bg-sage-100"
                  >
                    {format(new Date(e.startTime), "h:mm").toLowerCase()}
                    {format(new Date(e.startTime), "a").toLowerCase()} {e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-xs font-semibold text-muted">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
