import mongoose from "mongoose";

// A single board message. Unlike posts (which embed their comments), messages
// are their own collection: the board is a high-volume, append-only stream we
// page through by time, so a flat collection with a time index fits best.
const messageSchema = new mongoose.Schema(
  {
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
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// History reads are "latest N in this neighborhood, paged backwards by time".
messageSchema.index({ neighborhood: 1, createdAt: -1 });

messageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Message", messageSchema);
