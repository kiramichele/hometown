import { api } from "./client.js";

// Board history. Live messages arrive over the socket, not here. Pass `before`
// (the oldest message's createdAt) to page further back in time.
export const messagesApi = {
  history: (before) =>
    api.get(before ? `/messages?before=${encodeURIComponent(before)}` : "/messages"),
};
