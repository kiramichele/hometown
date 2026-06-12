import { Router } from "express";
import mongoose from "mongoose";
import Event, { RSVP_STATUSES } from "../models/Event.js";
import {
  requireAuth,
  requireSameNeighborhood,
} from "../middleware/auth.js";
import { notify } from "../lib/notify.js";

const router = Router();

const PERSON_FIELDS = "displayName avatarUrl role";

// Load the event named by :id onto req.event, or 404. Paired with
// requireSameNeighborhood so a user can't reach another hood's events.
async function loadEvent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Event not found" });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    req.event = event;
    next();
  } catch (err) {
    next(err);
  }
}

// Re-fetch an event with host + RSVP users populated for the client.
function hydrate(id) {
  return Event.findById(id)
    .populate("host", PERSON_FIELDS)
    .populate("rsvps.user", PERSON_FIELDS);
}

router.use(requireAuth);

// GET /api/events/calendar?start=<iso>&end=<iso>
// The date-range query at the heart of this phase: every event in the user's
// neighborhood whose startTime falls inside [start, end]. Declared before
// "/:id" so "calendar" isn't parsed as an event id.
router.get("/calendar", async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) {
      return res
        .status(400)
        .json({ error: "Valid start and end query params are required" });
    }

    const events = await Event.find({
      neighborhood: req.user.neighborhood,
      startTime: { $gte: startDate, $lte: endDate },
    })
      .sort({ startTime: 1 })
      .populate("host", PERSON_FIELDS)
      .populate("rsvps.user", PERSON_FIELDS);

    res.json({ events });
  } catch (err) {
    next(err);
  }
});

// GET /api/events — upcoming events in this neighborhood (startTime >= now).
router.get("/", async (req, res, next) => {
  try {
    const events = await Event.find({
      neighborhood: req.user.neighborhood,
      startTime: { $gte: new Date() },
    })
      .sort({ startTime: 1 })
      .populate("host", PERSON_FIELDS)
      .populate("rsvps.user", PERSON_FIELDS);

    res.json({ events });
  } catch (err) {
    next(err);
  }
});

// POST /api/events — create an event hosted by the current user.
router.post("/", async (req, res, next) => {
  try {
    const { title, description, location, startTime, endTime } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const start = new Date(startTime);
    if (isNaN(start)) {
      return res.status(400).json({ error: "A valid start time is required" });
    }
    const end = endTime ? new Date(endTime) : undefined;
    if (end && isNaN(end)) {
      return res.status(400).json({ error: "End time is invalid" });
    }
    if (end && end < start) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    const event = await Event.create({
      neighborhood: req.user.neighborhood, // stamp the hood — never trust client
      host: req.user._id,
      title: title.trim(),
      description: (description || "").trim(),
      location: (location || "").trim(),
      startTime: start,
      endTime: end,
    });

    res.status(201).json({ event: await hydrate(event._id) });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id — event detail (must be in your neighborhood).
router.get(
  "/:id",
  loadEvent,
  requireSameNeighborhood((req) => req.event.neighborhood),
  async (req, res, next) => {
    try {
      res.json({ event: await hydrate(req.event._id) });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/events/:id — host edits their event.
router.patch(
  "/:id",
  loadEvent,
  requireSameNeighborhood((req) => req.event.neighborhood),
  async (req, res, next) => {
    try {
      if (String(req.event.host) !== String(req.user._id)) {
        return res.status(403).json({ error: "Only the host can edit this event" });
      }

      const { title, description, location, startTime, endTime } = req.body;
      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({ error: "Title can't be empty" });
        }
        req.event.title = title.trim();
      }
      if (description !== undefined) req.event.description = description.trim();
      if (location !== undefined) req.event.location = location.trim();
      if (startTime !== undefined) {
        const start = new Date(startTime);
        if (isNaN(start)) {
          return res.status(400).json({ error: "Invalid start time" });
        }
        req.event.startTime = start;
      }
      if (endTime !== undefined) {
        req.event.endTime = endTime ? new Date(endTime) : undefined;
      }
      if (
        req.event.endTime &&
        req.event.endTime < req.event.startTime
      ) {
        return res.status(400).json({ error: "End time must be after start time" });
      }

      await req.event.save();
      res.json({ event: await hydrate(req.event._id) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/events/:id — host, or a moderator/admin, can delete.
router.delete(
  "/:id",
  loadEvent,
  requireSameNeighborhood((req) => req.event.neighborhood),
  async (req, res, next) => {
    try {
      const isHost = String(req.event.host) === String(req.user._id);
      const isMod = ["moderator", "admin"].includes(req.user.role);
      if (!isHost && !isMod) {
        return res.status(403).json({ error: "Not allowed to delete this event" });
      }
      await req.event.deleteOne();
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/events/:id/rsvp — set this user's RSVP. Sending the status you
// already have removes the RSVP (toggle off); otherwise it's set/updated.
router.post(
  "/:id/rsvp",
  loadEvent,
  requireSameNeighborhood((req) => req.event.neighborhood),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!RSVP_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid RSVP status" });
      }
      const uid = String(req.user._id);
      const idx = req.event.rsvps.findIndex((r) => String(r.user) === uid);

      let setRsvp = true; // false only when toggling off
      if (idx === -1) {
        req.event.rsvps.push({ user: req.user._id, status });
      } else if (req.event.rsvps[idx].status === status) {
        req.event.rsvps.splice(idx, 1); // toggle off
        setRsvp = false;
      } else {
        req.event.rsvps[idx].status = status; // change of heart
      }

      await req.event.save();

      // Let the host know about a new/changed RSVP (not a toggle-off).
      if (setRsvp) {
        const verb = { going: "is going to", maybe: "might go to", no: "can't make" }[status];
        notify({
          recipient: req.event.host,
          actor: req.user._id,
          neighborhood: req.user.neighborhood,
          type: "event_rsvp",
          text: `${req.user.displayName} ${verb} "${req.event.title}"`,
          link: `/events/${req.event._id}`,
        }).catch((e) => console.error("notify failed:", e.message));
      }

      res.json({ event: await hydrate(req.event._id) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
