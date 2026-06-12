import { useState } from "react";
import { LISTING_CATEGORIES } from "../lib/listingCategories.js";
import { uploadImages } from "../api/uploads.js";

const MAX_IMAGES = 6;

// Modal for creating or editing a listing. `initial` (a listing) = edit mode.
// On submit it uploads any newly-picked files to Cloudinary, merges them with
// kept existing images, and hands a ready payload to onSubmit.
export default function ListingForm({ initial, onSubmit, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [category, setCategory] = useState(initial?.category || "other");
  const [location, setLocation] = useState(initial?.location || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [existingImages, setExistingImages] = useState(initial?.images || []);
  const [picked, setPicked] = useState([]); // [{ file, preview }]
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const totalImages = existingImages.length + picked.length;

  function addFiles(e) {
    const files = [...e.target.files];
    e.target.value = ""; // allow re-picking the same file
    const room = MAX_IMAGES - totalImages;
    const next = files.slice(0, room).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPicked((prev) => [...prev, ...next]);
  }

  function removePicked(i) {
    setPicked((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function removeExisting(i) {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return setError("Please add a title.");
    const priceNum = Number(price);
    if (price === "" || isNaN(priceNum) || priceNum < 0)
      return setError("Please enter a valid price (0 for free).");

    setBusy(true);
    setError("");
    try {
      let uploaded = [];
      if (picked.length) {
        uploaded = await uploadImages(picked.map((p) => p.file));
      }
      await onSubmit({
        title: title.trim(),
        price: priceNum,
        category,
        location: location.trim(),
        description: description.trim(),
        images: [...existingImages, ...uploaded].slice(0, MAX_IMAGES),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-extrabold">
          {initial ? "Edit listing" : "List an item"}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="input"
            placeholder="What are you selling?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-muted">
              Price ($, 0 = free)
              <input
                type="number"
                min="0"
                className="input mt-1"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-muted">
              Category
              <select
                className="input mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <input
            className="input"
            placeholder="Pickup location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Description (condition, details…)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Image picker + previews */}
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {existingImages.map((url, i) => (
                <div key={url} className="relative h-20 w-20">
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExisting(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-cream"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {picked.map((p, i) => (
                <div key={p.preview} className="relative h-20 w-20">
                  <img
                    src={p.preview}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePicked(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-cream"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {totalImages < MAX_IMAGES && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-black/15 text-2xl text-muted transition hover:border-sage-400 hover:text-sage-500">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={addFiles}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted">
              Up to {MAX_IMAGES} photos · {totalImages}/{MAX_IMAGES} added
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 font-semibold text-muted transition hover:bg-black/5"
            >
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy
                ? picked.length
                  ? "Uploading…"
                  : "Saving…"
                : initial
                ? "Save changes"
                : "Post listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
