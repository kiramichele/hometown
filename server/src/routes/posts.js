import { Router } from "express";
import mongoose from "mongoose";
import Post, { POST_CATEGORIES, REACTION_TYPES } from "../models/Post.js";
import {
  requireAuth,
  requireSameNeighborhood,
} from "../middleware/auth.js";
import { notify } from "../lib/notify.js";

const router = Router();

// Fields we expose for any user referenced on a post (author, commenter).
const AUTHOR_FIELDS = "displayName avatarUrl role";

// Loads the post named by :id and stashes it on req.post, or 404s. Used by the
// single-resource routes below, paired with requireSameNeighborhood so a user
// can never touch a post outside their neighborhood.
async function loadPost(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Post not found" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    req.post = post;
    next();
  } catch (err) {
    next(err);
  }
}

// Re-fetch a post with its author + comment authors populated. We do this after
// mutations so the client always gets back a fully-hydrated post to render.
function hydrate(id) {
  return Post.findById(id)
    .populate("author", AUTHOR_FIELDS)
    .populate("comments.author", AUTHOR_FIELDS);
}

// Every route here requires a logged-in user.
router.use(requireAuth);

// GET /api/posts?category=alert — list this neighborhood's posts, newest first.
// Optional category filter; omitting it (or "all") returns everything.
router.get("/", async (req, res, next) => {
  try {
    const filter = { neighborhood: req.user.neighborhood };
    const { category } = req.query;
    if (category && category !== "all") {
      if (!POST_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Unknown category" });
      }
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("author", AUTHOR_FIELDS)
      .populate("comments.author", AUTHOR_FIELDS);

    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — create a post in the author's own neighborhood.
router.post("/", async (req, res, next) => {
  try {
    const { body, category } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: "Post body is required" });
    }
    if (category && !POST_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Unknown category" });
    }

    const post = await Post.create({
      neighborhood: req.user.neighborhood, // stamp the hood — never trust the client
      author: req.user._id,
      body: body.trim(),
      category: category || "general",
    });

    res.status(201).json({ post: await hydrate(post._id) });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id — read a single post (must be in your neighborhood).
router.get(
  "/:id",
  loadPost,
  requireSameNeighborhood((req) => req.post.neighborhood),
  async (req, res, next) => {
    try {
      res.json({ post: await hydrate(req.post._id) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/posts/:id — author can delete their own; moderators/admins can
// delete any post in the neighborhood (the Phase 6 moderation seam).
router.delete(
  "/:id",
  loadPost,
  requireSameNeighborhood((req) => req.post.neighborhood),
  async (req, res, next) => {
    try {
      const isAuthor = String(req.post.author) === String(req.user._id);
      const isMod = ["moderator", "admin"].includes(req.user.role);
      if (!isAuthor && !isMod) {
        return res.status(403).json({ error: "Not allowed to delete this post" });
      }
      await req.post.deleteOne();
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/posts/:id/comments — add a comment to a post.
router.post(
  "/:id/comments",
  loadPost,
  requireSameNeighborhood((req) => req.post.neighborhood),
  async (req, res, next) => {
    try {
      const { body } = req.body;
      if (!body || !body.trim()) {
        return res.status(400).json({ error: "Comment body is required" });
      }
      req.post.comments.push({ author: req.user._id, body: body.trim() });
      await req.post.save();

      // Let the post's author know someone replied (fire-and-forget).
      notify({
        recipient: req.post.author,
        actor: req.user._id,
        neighborhood: req.user.neighborhood,
        type: "post_comment",
        text: `${req.user.displayName} commented on your post`,
        link: "/",
      }).catch((e) => console.error("notify failed:", e.message));

      res.status(201).json({ post: await hydrate(req.post._id) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/posts/:id/reactions — toggle a reaction of {type} for this user.
// Reacting with a type you already left removes it; otherwise it's added.
router.post(
  "/:id/reactions",
  loadPost,
  requireSameNeighborhood((req) => req.post.neighborhood),
  async (req, res, next) => {
    try {
      const { type } = req.body;
      if (!REACTION_TYPES.includes(type)) {
        return res.status(400).json({ error: "Unknown reaction type" });
      }
      const uid = String(req.user._id);
      const existing = req.post.reactions.find(
        (r) => String(r.user) === uid && r.type === type
      );
      const added = !existing;
      if (existing) {
        req.post.reactions.pull(existing);
      } else {
        req.post.reactions.push({ user: req.user._id, type });
      }
      await req.post.save();

      // Only notify when a reaction is added (not when toggled off).
      if (added) {
        notify({
          recipient: req.post.author,
          actor: req.user._id,
          neighborhood: req.user.neighborhood,
          type: "post_reaction",
          text: `${req.user.displayName} reacted to your post`,
          link: "/",
        }).catch((e) => console.error("notify failed:", e.message));
      }

      res.json({ post: await hydrate(req.post._id) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
