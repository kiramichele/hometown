import { io } from "socket.io-client";
import { tokenStore } from "../api/client.js";

// Create a Socket.io connection to our server. We connect same-origin (no URL),
// so Vite's /socket.io proxy forwards it to the API server in dev, and it just
// works in production where both are served together. The JWT goes in the
// handshake auth — the server verifies it the same way the REST API does.
export function createSocket() {
  return io({
    auth: { token: tokenStore.get() },
  });
}
