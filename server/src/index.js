import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { attachRealtime } from "./realtime.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import eventRoutes from "./routes/events.js";
import messageRoutes from "./routes/messages.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Health check — handy for confirming the server is up.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/messages", messageRoutes);

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
