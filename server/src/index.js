import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Health check — handy for confirming the server is up.
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// Centralized error handler — routes call next(err) and land here so we never
// leak a stack trace to the client but still log it server-side.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGODB_URI);
app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
