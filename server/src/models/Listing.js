import mongoose from "mongoose";

// Marketplace categories. Single source of truth — routes validate against this
// and the client imports the same shape.
export const LISTING_CATEGORIES = [
  "furniture",
  "electronics",
  "household",
  "tools",
  "kids",
  "clothing",
  "free",
  "other",
];

export const LISTING_STATUSES = ["available", "sold"];

const listingSchema = new mongoose.Schema(
  {
    neighborhood: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood",
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    // Price in whole dollars (not cents) — a neighborhood marketplace, not a
    // payment system. "free" category listings are typically 0.
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: LISTING_CATEGORIES,
      default: "other",
      index: true,
    },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: "available",
      index: true,
    },
    // Cloudinary (or local) URLs of uploaded photos.
    images: { type: [String], default: [] },
    location: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// Full-text search over title + description (the marketplace search box).
listingSchema.index({ title: "text", description: "text" });
// Common "browse this neighborhood, newest first" path.
listingSchema.index({ neighborhood: 1, createdAt: -1 });

listingSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Listing", listingSchema);
