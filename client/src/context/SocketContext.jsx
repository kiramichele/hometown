import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { createSocket } from "../lib/socket.js";

// One Socket.io connection for the whole logged-in session — shared by the
// board (messages/typing/presence) and live notifications. Opening it here (not
// per-page) means notifications arrive anywhere in the app, and a user counts
// as "online" the moment they sign in.
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }
    const s = createSocket();
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
