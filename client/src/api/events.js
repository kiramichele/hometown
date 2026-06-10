import { api } from "./client.js";

// Wrapper around the events endpoints. Each returns parsed JSON and throws on
// non-2xx via the api client.
export const eventsApi = {
  // The date-range query — pass ISO strings for the visible window.
  calendar: (startISO, endISO) =>
    api.get(
      `/events/calendar?start=${encodeURIComponent(
        startISO
      )}&end=${encodeURIComponent(endISO)}`
    ),
  upcoming: () => api.get("/events"),
  get: (id) => api.get(`/events/${id}`),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  remove: (id) => api.del(`/events/${id}`),
  rsvp: (id, status) => api.post(`/events/${id}/rsvp`, { status }),
};
