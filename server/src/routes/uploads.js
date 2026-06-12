import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage, isUploadConfigured } from "../lib/upload.js";

// Keep files in memory (small images, max 6) and stream straight to Cloudinary
// — no temp files on disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5 MB each
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Run multer but translate its errors (too big, wrong type) into clean 400s
// instead of letting them hit the generic 500 handler.
function handleMultipart(req, res, next) {
  upload.array("images", 6)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed" });
    next();
  });
}

const router = Router();
router.use(requireAuth);

// POST /api/uploads — accept up to 6 images (field name "images"), upload each
// to Cloudinary, and return their hosted URLs. Clients call this first, then
// include the returned URLs when creating a listing.
router.post("/", handleMultipart, async (req, res, next) => {
  try {
    if (!isUploadConfigured()) {
      return res.status(503).json({
        error: "Image upload isn't configured yet (set CLOUDINARY_URL on the server).",
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }
    let results;
    try {
      results = await Promise.all(req.files.map((f) => uploadImage(f.buffer)));
    } catch (uploadErr) {
      // Cloudinary rejected a file (corrupt/unsupported) — that's the client's
      // input, not a server fault, so report it as a 400 rather than a 500.
      console.error("Cloudinary upload failed:", uploadErr.message);
      return res
        .status(400)
        .json({ error: "One or more images couldn't be processed." });
    }
    res.status(201).json({ urls: results.map((r) => r.url) });
  } catch (err) {
    next(err);
  }
});

export default router;
