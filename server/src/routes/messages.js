import { Router } from "express";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const AUTHOR_FIELDS = "displayName avatarUrl role";
const PAGE_SIZE = 50;

router.use(requireAuth);

// GET /api/messages?before=<iso> — the board's history. Returns up to 50
// messages in this neighborhood, oldest-first for rendering. Pass `before`
// (the timestamp of the oldest message you have) to page further back.
// Live messages after load arrive over the socket, not here.
router.get("/", async (req, res, next) => {
  try {
    const filter = { neighborhood: req.user.neighborhood };
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (isNaN(before)) {
        return res.status(400).json({ error: "Invalid 'before' cursor" });
      }
      filter.createdAt = { $lt: before };
    }

    // Pull the newest page, then reverse so the client renders oldest→newest.
    const newestFirst = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE + 1) // grab one extra to detect "has more"
      .populate("author", AUTHOR_FIELDS);

    const hasMore = newestFirst.length > PAGE_SIZE;
    const messages = newestFirst.slice(0, PAGE_SIZE).reverse();

    res.json({ messages, hasMore });
  } catch (err) {
    next(err);
  }
});

export default router;
