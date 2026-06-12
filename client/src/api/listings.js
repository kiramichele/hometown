import { api } from "./client.js";

// Build a query string from a filter object, skipping empty values.
function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== "" && v !== undefined && v !== null && v !== "all"
  );
  if (entries.length === 0) return "";
  const sp = new URLSearchParams(entries);
  return `?${sp.toString()}`;
}

export const listingsApi = {
  list: (params) => api.get(`/listings${qs(params)}`),
  get: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post("/listings", data),
  update: (id, data) => api.patch(`/listings/${id}`, data),
  remove: (id) => api.del(`/listings/${id}`),
};
