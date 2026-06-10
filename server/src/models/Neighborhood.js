import mongoose from "mongoose";

const neighborhoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Single-neighborhood for now, but every document references this so
    // flipping to multi-tenant later needs no migration.
    description: { type: String, default: "" },
    // Default map center for the Phase 7 Leaflet map. Stored as [lng, lat]
    // (GeoJSON order) so we can add a 2dsphere index later if needed.
    center: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [-77.9261, 34.5527] }, // Burgaw, NC
    },
  },
  { timestamps: true }
);

export default mongoose.model("Neighborhood", neighborhoodSchema);
