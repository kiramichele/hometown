import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listingsApi } from "../api/listings.js";
import { LISTING_CATEGORIES } from "../lib/listingCategories.js";
import Layout from "../components/Layout.jsx";
import ListingCard from "../components/ListingCard.jsx";
import ListingForm from "../components/ListingForm.jsx";

export default function Marketplace() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Debounce the free-text search so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listingsApi
      .list({ q: debouncedQ, category, status, minPrice, maxPrice, sort })
      .then(({ listings }) => !cancelled && setListings(listings))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, category, status, minPrice, maxPrice, sort]);

  async function handleCreate(data) {
    const { listing } = await listingsApi.create(data);
    setShowForm(false);
    navigate(`/market/${listing._id}`);
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Marketplace</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + List an item
        </button>
      </div>

      {/* Filter bar */}
      <div className="card mb-5 space-y-3 p-3">
        <input
          className="input"
          placeholder="Search listings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Any status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              className="input"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              min="0"
              className="input"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-muted">Loading listings…</p>
      ) : error ? (
        <p className="py-10 text-center text-red-600">{error}</p>
      ) : listings.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          <p className="text-2xl">🛒</p>
          <p className="mt-2 font-semibold">No listings match</p>
          <p className="text-sm">Try clearing filters, or list something yourself.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </div>
      )}

      {showForm && (
        <ListingForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}
    </Layout>
  );
}
