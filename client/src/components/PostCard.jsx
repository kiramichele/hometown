import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORY_MAP } from "../lib/categories.js";
import { timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";
import ReactionBar from "./ReactionBar.jsx";
import CommentThread from "./CommentThread.jsx";

export default function PostCard({ post, onReact, onComment, onDelete }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  const category = CATEGORY_MAP[post.category] || CATEGORY_MAP.general;
  const isAuthor = String(post.author?._id) === String(user._id);
  const canDelete = isAuthor || ["moderator", "admin"].includes(user.role);

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    await onDelete();
  }

  return (
    <article className="card mb-4 p-4">
      <div className="flex items-start gap-3">
        <Avatar user={post.author} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {post.author?.displayName || "Someone"}
            </span>
            <span className="text-muted">·</span>
            <span className="text-sm text-muted">{timeAgo(post.createdAt)}</span>
            <span
              className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${category.badge}`}
            >
              {category.emoji} {category.label}
            </span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {post.body}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <ReactionBar reactions={post.reactions} onToggle={onReact} />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowComments((s) => !s)}
                className="rounded-full px-2.5 py-1 text-sm font-semibold text-muted transition hover:bg-black/5 hover:text-ink"
              >
                💬 {post.comments.length > 0 ? post.comments.length : ""} Comment
                {post.comments.length === 1 ? "" : "s"}
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  title="Delete post"
                  className="rounded-full px-2.5 py-1 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-600"
                >
                  🗑
                </button>
              )}
            </div>
          </div>

          {showComments && (
            <CommentThread comments={post.comments} onAdd={onComment} />
          )}
        </div>
      </div>
    </article>
  );
}
