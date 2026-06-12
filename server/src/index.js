import "dotenv/config";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { attachRealtime } from "./realtime.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import eventRoutes from "./routes/events.js";
import messageRoutes from "./routes/messages.js";
import listingRoutes from "./routes/listings.js";
import uploadRoutes from "./routes/uploads.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Health check — handy for confirming the server is up.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

// In production (single-service deploy) the server also serves the built React
// app. We detect the build rather than reading NODE_ENV: in dev the dist folder
// doesn't exist (Vite serves the client), so this block is simply skipped.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html so client-side routing
  // (/, /events, /board, /market, …) works on direct load and refresh.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
  console.log("✓ Serving client build from", clientDist);
}

// Centralized error handler — routes call next(err) and land here so we never
// leak a stack trace to the client but still log it server-side.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

// Wrap Express in an http server so Socket.io can share the same port, then
// attach the realtime board (Phase 3).
const server = http.createServer(app);
attachRealtime(server);

await connectDB(process.env.MONGODB_URI);
server.listen(PORT, () =>
  console.log(`✓ Server running on http://localhost:${PORT} (HTTP + WebSocket)`)
);
