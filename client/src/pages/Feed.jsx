import { useEffect, useState } from "react";
import { postsApi } from "../api/posts.js";
import Layout from "../components/Layout.jsx";
import ComposeBox from "../components/ComposeBox.jsx";
import CategoryFilter from "../components/CategoryFilter.jsx";
import PostCard from "../components/PostCard.jsx";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // (Re)load the feed whenever the category filter changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    postsApi
      .list(category)
      .then(({ posts }) => !cancelled && setPosts(posts))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category]);

  // Replace one post in place after a comment/reaction mutation.
  function replacePost(updated) {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  }

  async function handleCreate(body, cat) {
    const { post } = await postsApi.create(body, cat);
    // Only prepend if it belongs in the current view.
    if (category === "all" || category === post.category) {
      setPosts((prev) => [post, ...prev]);
    }
  }

  async function handleReact(id, type) {
    const { post } = await postsApi.toggleReaction(id, type);
    replacePost(post);
  }

  async function handleComment(id, body) {
    const { post } = await postsApi.addComment(id, body);
    replacePost(post);
  }

  async function handleDelete(id) {
    await postsApi.remove(id);
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  return (
    <Layout>
      <ComposeBox onCreate={handleCreate} />
      <CategoryFilter value={category} onChange={setCategory} />

      {loading ? (
        <p className="py-10 text-center text-muted">Loading the feed…</p>
      ) : error ? (
        <p className="py-10 text-center text-red-600">{error}</p>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          <p className="text-2xl">🌱</p>
          <p className="mt-2 font-semibold">Nothing here yet</p>
          <p className="text-sm">
            Be the first to post something to the neighborhood.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onReact={(type) => handleReact(post._id, type)}
            onComment={(body) => handleComment(post._id, body)}
            onDelete={() => handleDelete(post._id)}
          />
        ))
      )}
    </Layout>
  );
}
