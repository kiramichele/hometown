import { Link } from "react-router-dom";
import { formatPrice, LISTING_CATEGORY_MAP } from "../lib/listingCategories.js";

export default function ListingCard({ listing }) {
  const cat = LISTING_CATEGORY_MAP[listing.category] || LISTING_CATEGORY_MAP.other;
  const cover = listing.images?.[0];
  const sold = listing.status === "sold";

  return (
    <Link
      to={`/market/${listing._id}`}
      className="card group overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-black/[0.04]">
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            className={`h-full w-full object-cover transition group-hover:scale-[1.02] ${
              sold ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {cat.emoji}
          </div>
        )}
        {sold && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-cream">
            SOLD
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink">
          {cat.emoji} {cat.label}
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold">{listing.title}</h3>
          <span
            className={`shrink-0 font-extrabold ${
              listing.price === 0 ? "text-sage-600" : "text-ink"
            }`}
          >
            {formatPrice(listing.price)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted">
          {listing.seller?.displayName}
          {listing.location ? ` · ${listing.location}` : ""}
        </p>
      </div>
    </Link>
  );
}
