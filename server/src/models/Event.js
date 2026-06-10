import mongoose from "mongoose";

// The RSVP states a neighbor can choose. One RSVP per user per event.
export const RSVP_STATUSES = ["going", "maybe", "no"];

// Embedded: an RSVP lives inside its event. We always read RSVPs with the
// event, never on their own, so embedding fits (same call as Phase 1's
// comments). We keep _id off and match on the user instead.
const rsvpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: RSVP_STATUSES, required: true },
  },
  { _id: false, timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    // The hand-rolled RLS seam — every event belongs to one neighborhood.
    neighborhood: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood",
      required: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    location: { type: String, default: "", trim: true, maxlength: 200 },
    // Indexed because the calendar range query (start <= startTime <= end) is
    // the hot path for this whole phase.
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    rsvps: [rsvpSchema],
  },
  { timestamps: true }
);

// Compound index for "events in this neighborhood within a date window".
eventSchema.index({ neighborhood: 1, startTime: 1 });

eventSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Event", eventSchema);
