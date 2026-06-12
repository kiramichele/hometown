import mongoose from "mongoose";

// The kinds of events that generate a notification. Add to this as later
// phases call notify() from new places.
export const NOTIFICATION_TYPES = [
  "post_comment",
  "post_reaction",
  "event_rsvp",
];

const notificationSchema = new mongoose.Schema(
  {
    // Who receives it. Indexed because every read is "my notifications".
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Carried through for RLS consistency with the rest of the app.
    neighborhood: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood",
      required: true,
    },
    // Who triggered it (shown with their avatar in the notification center).
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    // Pre-rendered message + where clicking should take the user.
    text: { type: String, required: true },
    link: { type: String, default: "/" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// "My notifications, newest first" is the hot path.
notificationSchema.index({ recipient: 1, createdAt: -1 });

notificationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Notification", notificationSchema);
