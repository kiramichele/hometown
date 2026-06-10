import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../lib/categories.js";
import Avatar from "./Avatar.jsx";

// The "what's happening in the neighborhood" composer at the top of the feed.
// Lifts the created post up to the feed via onCreate.
export default function ComposeBox({ onCreate }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onCreate(text, category);
      setBody("");
      setCategory("general");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card mb-6 p-4">
      <div className="flex gap-3">
        <Avatar user={user} size={40} />
        <div className="flex-1">
          <textarea
            className="input min-h-[72px] resize-none"
            placeholder={`What's happening in the neighborhood, ${
              user.displayName.split(" ")[0]
            }?`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = c.key === category;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                      active
                        ? "bg-sage-500 text-white"
                        : "bg-black/5 text-muted hover:bg-black/10"
                    }`}
                  >
                    <span className="mr-1">{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
