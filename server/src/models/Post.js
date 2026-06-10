import mongoose from "mongoose";

// The four post categories. Kept here as the single source of truth so routes
// can validate against it and the client can import the same list shape.
export const POST_CATEGORIES = ["general", "recommendation", "alert", "forsale"];

// The reaction types neighbors can leave on a post. Slack-style: a user may
// toggle each type independently, and we show a count per type.
export const REACTION_TYPES = ["like", "love", "celebrate", "sad"];

// Embedded: a comment lives inside its parent post document. We get timestamps
// for free and never query comments on their own, so embedding beats a separate
// collection here (this is the "embedded documents" skill for Phase 1).
const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// Embedded: one reaction = one (user, type) pair. No _id needed since we match
// on the pair, not by id.
const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: REACTION_TYPES, required: true },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    // Every document references the neighborhood — the hand-rolled RLS seam.
    neighborhood: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: POST_CATEGORIES,
      default: "general",
      index: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    comments: [commentSchema],
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

// Newest-first feed reads, scoped to a neighborhood, are the hot path.
postSchema.index({ neighborhood: 1, createdAt: -1 });

postSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Post", postSchema);
