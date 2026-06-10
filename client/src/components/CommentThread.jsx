import { useState } from "react";
import Avatar from "./Avatar.jsx";
import { timeAgo } from "../lib/time.js";

// The comment list + composer shown under a post. onAdd(body) persists the
// comment and returns the updated post (handled by the parent).
export default function CommentThread({ comments = [], onAdd }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(text);
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-black/5 pt-3">
      {comments.length > 0 && (
        <ul className="mb-3 space-y-3">
          {comments.map((c) => (
            <li key={c._id} className="flex gap-2.5">
              <Avatar user={c.author} size={30} />
              <div className="flex-1">
                <div className="rounded-2xl bg-black/[0.03] px-3 py-2">
                  <span className="text-sm font-bold">
                    {c.author?.displayName || "Someone"}
                  </span>
                  <p className="text-sm text-ink/90">{c.body}</p>
                </div>
                <span className="ml-3 text-xs text-muted">
                  {timeAgo(c.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          className="input py-2"
          placeholder="Write a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          className="btn-primary px-4 py-2"
          onClick={submit}
          disabled={!body.trim() || submitting}
        >
          Send
        </button>
      </div>
    </div>
  );
}
