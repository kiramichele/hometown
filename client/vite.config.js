import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to the Express server so you don't fight CORS in dev
    // and the frontend can just call "/api/..." with no host.
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
