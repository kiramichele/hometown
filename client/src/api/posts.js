import { api } from "./client.js";

// Thin wrapper around the posts endpoints. Each returns the parsed JSON
// (e.g. { posts } or { post }) and throws on non-2xx via the api client.
export const postsApi = {
  list: (category) =>
    api.get(
      category && category !== "all"
        ? `/posts?category=${encodeURIComponent(category)}`
        : "/posts"
    ),
  create: (body, category) => api.post("/posts", { body, category }),
  remove: (id) => api.del(`/posts/${id}`),
  addComment: (id, body) => api.post(`/posts/${id}/comments`, { body }),
  toggleReaction: (id, type) => api.post(`/posts/${id}/reactions`, { type }),
};
