import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useSocket } from "./SocketContext.jsx";
import { notificationsApi } from "../api/notifications.js";

// Holds the current user's notifications + unread count, kept live via the
// shared socket. Powers the bell badge and the notification center.
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  // Initial load (and reset on logout).
  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }
    let cancelled = false;
    notificationsApi
      .list()
      .then(({ notifications, unreadCount }) => {
        if (cancelled) return;
        setItems(notifications);
        setUnread(unreadCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Live updates — prepend new notifications and bump the badge.
  useEffect(() => {
    if (!socket) return;
    const onNew = (n) => {
      setItems((prev) => [n, ...prev]);
      setUnread((c) => c + 1);
    };
    socket.on("notification:new", onNew);
    return () => socket.off("notification:new", onNew);
  }, [socket]);

  async function markRead(id) {
    setItems((prev) => {
      const target = prev.find((n) => n._id === id);
      if (target && !target.read) setUnread((c) => Math.max(0, c - 1));
      return prev.map((n) => (n._id === id ? { ...n, read: true } : n));
    });
    notificationsApi.markRead(id).catch(() => {});
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    notificationsApi.markAllRead().catch(() => {});
  }

  return (
    <NotificationsContext.Provider value={{ items, unread, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
