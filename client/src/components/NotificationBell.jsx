import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationsContext.jsx";
import { timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";

export default function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function openItem(n) {
    setOpen(false);
    if (!n.read) markRead(n._id);
    navigate(n.link || "/");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full px-2 py-1.5 text-lg transition hover:bg-black/5"
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sage-500 px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-[70vh] w-80 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
              <span className="font-bold">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-sm font-semibold text-sage-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">
                  No notifications yet.
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-2.5 px-4 py-3 text-left transition hover:bg-black/[0.03] ${
                      n.read ? "" : "bg-sage-50/60"
                    }`}
                  >
                    <Avatar user={n.actor} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{n.text}</p>
                      <span className="text-xs text-muted">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
