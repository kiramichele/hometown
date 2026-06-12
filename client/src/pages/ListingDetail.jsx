import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { listingsApi } from "../api/listings.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  formatPrice,
  LISTING_CATEGORY_MAP,
} from "../lib/listingCategories.js";
import Layout from "../components/Layout.jsx";
import Avatar from "../components/Avatar.jsx";
import ListingForm from "../components/ListingForm.jsx";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listingsApi
      .get(id)
      .then(({ listing }) => {
        if (cancelled) return;
        setListing(listing);
        setActive(0);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleSold() {
    const next = listing.status === "sold" ? "available" : "sold";
    const { listing: updated } = await listingsApi.update(id, { status: next });
    setListing(updated);
  }

  async function handleEdit(data) {
    const { listing: updated } = await listingsApi.update(id, data);
    setListing(updated);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this listing?")) return;
    await listingsApi.remove(id);
    navigate("/market");
  }

  if (loading)
    return (
      <Layout>
        <p className="py-10 text-center text-muted">Loading…</p>
      </Layout>
    );

  if (error || !listing)
    return (
      <Layout>
        <p className="py-10 text-center text-red-600">
          {error || "Listing not found."}
        </p>
        <p className="text-center">
          <Link to="/market" className="font-bold text-sage-600 hover:underline">
            ← Back to marketplace
          </Link>
        </p>
      </Layout>
    );

  const cat = LISTING_CATEGORY_MAP[listing.category] || LISTING_CATEGORY_MAP.other;
  const isSeller = String(listing.seller?._id) === String(user._id);
  const canDelete = isSeller || ["moderator", "admin"].includes(user.role);
  const sold = listing.status === "sold";
  const images = listing.images || [];

  return (
    <Layout>
      <Link
        to="/market"
        className="mb-3 inline-block text-sm font-bold text-sage-600 hover:underline"
      >
        ← Back to marketplace
      </Link>

      <div className="card overflow-hidden">
        {/* Gallery */}
        <div className="relative aspect-[16/10] bg-black/[0.04]">
          {images[active] ? (
            <img
              src={images[active]}
              alt={listing.title}
              className={`h-full w-full object-contain ${sold ? "opacity-70" : ""}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">
              {cat.emoji}
            </div>
          )}
          {sold && (
            <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-sm font-bold text-cream">
              SOLD
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2">
            {images.map((url, i) => (
              <button
                key={url}
                onClick={() => setActive(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${
                  i === active ? "ring-sage-500" : "ring-transparent"
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold">{listing.title}</h1>
            <span
              className={`shrink-0 text-2xl font-extrabold ${
                listing.price === 0 ? "text-sage-600" : "text-ink"
              }`}
            >
              {formatPrice(listing.price)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-black/5 px-2.5 py-1 font-semibold">
              {cat.emoji} {cat.label}
            </span>
            {listing.location && (
              <span className="text-muted">📍 {listing.location}</span>
            )}
          </div>

          {listing.description && (
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2 border-t border-black/5 pt-4">
            <Avatar user={listing.seller} size={36} />
            <div className="text-sm">
              <div className="font-bold">{listing.seller?.displayName}</div>
              <div className="text-muted">Seller</div>
            </div>
          </div>

          {/* Seller / moderator actions */}
          {(isSeller || canDelete) && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
              {isSeller && (
                <>
                  <button onClick={toggleSold} className="btn-primary">
                    {sold ? "Mark as available" : "Mark as sold"}
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-full border border-black/10 px-4 py-2 font-semibold text-ink transition hover:border-black/25"
                  >
                    Edit
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="rounded-full px-4 py-2 font-semibold text-muted transition hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <ListingForm
          initial={listing}
          onSubmit={handleEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </Layout>
  );
}
