import { Router } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const ACTOR_FIELDS = "displayName avatarUrl role";
const PAGE_SIZE = 30;

router.use(requireAuth);

// GET /api/notifications — the current user's recent notifications (newest
// first) plus the unread count for the badge.
router.get("/", async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(PAGE_SIZE)
        .populate("actor", ACTOR_FIELDS),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read — mark a single notification read. Scoped
// to the recipient so you can only touch your own.
router.patch("/:id/read", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Notification not found" });
    }
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: "Notification not found" });
    res.json({ notification: notif });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/read-all — mark all of the user's notifications read.
router.post("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
