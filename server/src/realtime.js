import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Message from "./models/Message.js";

const AUTHOR_FIELDS = "displayName avatarUrl role";

// In-memory presence: neighborhoodId -> Map(userId -> { user, count }).
// `count` tracks open sockets per user so multiple tabs don't double-list them
// (and they only drop offline when their last tab closes). This lives in
// process memory — fine for a single-server v1; a multi-server deploy would
// move this to Redis.
const presence = new Map();

function roomFor(neighborhoodId) {
  return `hood:${neighborhoodId}`;
}

function presenceList(hood) {
  const users = presence.get(hood);
  return users ? [...users.values()].map((e) => e.user) : [];
}

function addPresence(hood, user) {
  if (!presence.has(hood)) presence.set(hood, new Map());
  const users = presence.get(hood);
  const id = String(user._id);
  const entry = users.get(id);
  if (entry) entry.count += 1;
  else
    users.set(id, {
      count: 1,
      user: {
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
}

function removePresence(hood, userId) {
  const users = presence.get(hood);
  if (!users) return;
  const entry = users.get(String(userId));
  if (!entry) return;
  entry.count -= 1;
  if (entry.count <= 0) users.delete(String(userId));
}

export function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" },
  });

  // Handshake auth — same JWT the REST API uses, passed via socket auth.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    const hood = String(user.neighborhood);
    const room = roomFor(hood);

    // Join this neighborhood's room — the scoping that keeps every broadcast
    // inside one neighborhood (the realtime equivalent of requireSameNeighborhood).
    socket.join(room);
    addPresence(hood, user);
    io.to(room).emit("presence", presenceList(hood));

    // A neighbor sends a board message: persist it, then fan out to the room
    // (including the sender, so everyone renders from the same saved source).
    socket.on("message:send", async ({ body } = {}, ack) => {
      try {
        const text = (body || "").trim();
        if (!text) return ack?.({ error: "Message can't be empty" });

        const msg = await Message.create({
          neighborhood: user.neighborhood,
          author: user._id,
          body: text,
        });
        const populated = await msg.populate("author", AUTHOR_FIELDS);

        io.to(room).emit("message:new", populated.toJSON());
        ack?.({ ok: true });
      } catch (err) {
        console.error("message:send failed", err);
        ack?.({ error: "Failed to send" });
      }
    });

    // Typing indicator — broadcast to everyone in the room except the sender.
    socket.on("typing", (isTyping) => {
      socket.to(room).emit("typing", {
        user: { _id: user._id, displayName: user.displayName },
        isTyping: !!isTyping,
      });
    });

    socket.on("disconnect", () => {
      removePresence(hood, user._id);
      io.to(room).emit("presence", presenceList(hood));
      // Make sure a dropped connection doesn't leave a stuck "typing…".
      socket.to(room).emit("typing", {
        user: { _id: user._id, displayName: user.displayName },
        isTyping: false,
      });
    });
  });

  return io;
}
