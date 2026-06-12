import { Router } from "express";
import mongoose from "mongoose";
import Listing, {
  LISTING_CATEGORIES,
  LISTING_STATUSES,
} from "../models/Listing.js";
import {
  requireAuth,
  requireSameNeighborhood,
} from "../middleware/auth.js";

const router = Router();

const SELLER_FIELDS = "displayName avatarUrl role";

async function loadListing(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Listing not found" });
    }
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    req.listing = listing;
    next();
  } catch (err) {
    next(err);
  }
}

router.use(requireAuth);

// GET /api/listings — browse/search this neighborhood's marketplace.
// Query params: q (text), category, status, minPrice, maxPrice, sort
//   (newest | price_asc | price_desc). All optional and combinable.
router.get("/", async (req, res, next) => {
  try {
    const filter = { neighborhood: req.user.neighborhood };
    const { q, category, status, minPrice, maxPrice, sort } = req.query;

    if (category && category !== "all") {
      if (!LISTING_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Unknown category" });
      }
      filter.category = category;
    }

    if (status && status !== "all") {
      if (!LISTING_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Unknown status" });
      }
      filter.status = status;
    }

    // Price range — build a {$gte, $lte} only from the bounds provided.
    const priceFilter = {};
    if (minPrice !== undefined && minPrice !== "") {
      const n = Number(minPrice);
      if (isNaN(n)) return res.status(400).json({ error: "Invalid minPrice" });
      priceFilter.$gte = n;
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      const n = Number(maxPrice);
      if (isNaN(n)) return res.status(400).json({ error: "Invalid maxPrice" });
      priceFilter.$lte = n;
    }
    if (Object.keys(priceFilter).length) filter.price = priceFilter;

    if (q && q.trim()) filter.$text = { $search: q.trim() };

    let sortSpec = { createdAt: -1 };
    if (sort === "price_asc") sortSpec = { price: 1 };
    else if (sort === "price_desc") sortSpec = { price: -1 };

    const listings = await Listing.find(filter)
      .sort(sortSpec)
      .populate("seller", SELLER_FIELDS);

    res.json({ listings });
  } catch (err) {
    next(err);
  }
});

// POST /api/listings — list an item for sale in your neighborhood.
router.post("/", async (req, res, next) => {
  try {
    const { title, description, price, category, images, location } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "A valid price is required" });
    }
    if (category && !LISTING_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Unknown category" });
    }

    const listing = await Listing.create({
      neighborhood: req.user.neighborhood, // stamp the hood — never trust client
      seller: req.user._id,
      title: title.trim(),
      description: (description || "").trim(),
      price: priceNum,
      category: category || "other",
      images: Array.isArray(images) ? images.slice(0, 6) : [],
      location: (location || "").trim(),
    });

    res.status(201).json({
      listing: await listing.populate("seller", SELLER_FIELDS),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/listings/:id — listing detail.
router.get(
  "/:id",
  loadListing,
  requireSameNeighborhood((req) => req.listing.neighborhood),
  async (req, res, next) => {
    try {
      res.json({
        listing: await req.listing.populate("seller", SELLER_FIELDS),
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/listings/:id — seller edits their listing, including the
// "mark as sold" state transition ({ status: "sold" }).
router.patch(
  "/:id",
  loadListing,
  requireSameNeighborhood((req) => req.listing.neighborhood),
  async (req, res, next) => {
    try {
      if (String(req.listing.seller) !== String(req.user._id)) {
        return res.status(403).json({ error: "Only the seller can edit this listing" });
      }

      const { title, description, price, category, status, images, location } =
        req.body;

      if (title !== undefined) {
        if (!title.trim()) return res.status(400).json({ error: "Title can't be empty" });
        req.listing.title = title.trim();
      }
      if (description !== undefined) req.listing.description = description.trim();
      if (price !== undefined) {
        const n = Number(price);
        if (isNaN(n) || n < 0) return res.status(400).json({ error: "Invalid price" });
        req.listing.price = n;
      }
      if (category !== undefined) {
        if (!LISTING_CATEGORIES.includes(category)) {
          return res.status(400).json({ error: "Unknown category" });
        }
        req.listing.category = category;
      }
      if (status !== undefined) {
        if (!LISTING_STATUSES.includes(status)) {
          return res.status(400).json({ error: "Unknown status" });
        }
        req.listing.status = status;
      }
      if (images !== undefined && Array.isArray(images)) {
        req.listing.images = images.slice(0, 6);
      }
      if (location !== undefined) req.listing.location = location.trim();

      await req.listing.save();
      res.json({
        listing: await req.listing.populate("seller", SELLER_FIELDS),
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/listings/:id — seller, or a moderator/admin, can remove.
router.delete(
  "/:id",
  loadListing,
  requireSameNeighborhood((req) => req.listing.neighborhood),
  async (req, res, next) => {
    try {
      const isSeller = String(req.listing.seller) === String(req.user._id);
      const isMod = ["moderator", "admin"].includes(req.user.role);
      if (!isSeller && !isMod) {
        return res.status(403).json({ error: "Not allowed to delete this listing" });
      }
      await req.listing.deleteOne();
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
