import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy API calls to the Express server so you don't fight CORS in dev
    // and the frontend can just call "/api/..." with no host.
    proxy: {
      "/api": "http://localhost:5000",
      // Proxy the Socket.io endpoint (with WebSocket upgrade) so the client can
      // connect same-origin in dev, just like the REST calls.
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
