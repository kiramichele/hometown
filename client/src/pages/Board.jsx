import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { messagesApi } from "../api/messages.js";
import { createSocket } from "../lib/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import Avatar from "../components/Avatar.jsx";

// Turn the set of typing users into a friendly sentence.
function typingText(names) {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return "Several people are typing…";
}

export default function Board() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // id -> displayName
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimers = useRef({}); // auto-expire others' typing state
  const selfTypingTimer = useRef(null); // debounce our own "stopped typing"
  const isTypingRef = useRef(false);

  // Load history once, then open the socket and subscribe to live events.
  useEffect(() => {
    let cancelled = false;
    messagesApi
      .history()
      .then(({ messages, hasMore }) => {
        if (cancelled) return;
        setMessages(messages);
        setHasMore(hasMore);
      })
      .finally(() => !cancelled && setLoading(false));

    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("presence", (list) => setOnline(list));

    socket.on("typing", ({ user: u, isTyping }) => {
      const id = String(u._id);
      clearTimeout(typingTimers.current[id]);
      if (isTyping) {
        setTypingUsers((prev) => ({ ...prev, [id]: u.displayName }));
        // Safety net: drop the indicator if no "stopped" arrives.
        typingTimers.current[id] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 5000);
      } else {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, []);

  // Keep the latest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  function emitTyping(isTyping) {
    isTypingRef.current = isTyping;
    socketRef.current?.emit("typing", isTyping);
  }

  function handleDraftChange(e) {
    setDraft(e.target.value);
    if (!isTypingRef.current) emitTyping(true);
    clearTimeout(selfTypingTimer.current);
    selfTypingTimer.current = setTimeout(() => emitTyping(false), 1500);
  }

  function send() {
    const body = draft.trim();
    if (!body) return;
    socketRef.current?.emit("message:send", { body });
    setDraft("");
    clearTimeout(selfTypingTimer.current);
    emitTyping(false);
  }

  async function loadEarlier() {
    if (messages.length === 0) return;
    const { messages: older, hasMore } = await messagesApi.history(
      messages[0].createdAt
    );
    setMessages((prev) => [...older, ...prev]);
    setHasMore(hasMore);
  }

  const typingNames = Object.values(typingUsers);

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold">Neighborhood Board</h2>
          <p className="text-sm text-muted">
            {connected ? "Live" : "Connecting…"} ·{" "}
            <span className="font-semibold text-sage-600">
              {online.length} online
            </span>
          </p>
        </div>
        <div className="flex -space-x-2">
          {online.slice(0, 6).map((u) => (
            <div key={u._id} className="ring-2 ring-cream rounded-full">
              <Avatar user={u} size={30} />
            </div>
          ))}
        </div>
      </div>

      <div className="card flex h-[68vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <p className="py-10 text-center text-muted">Loading messages…</p>
          ) : (
            <>
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadEarlier}
                    className="rounded-full border border-black/10 px-3 py-1 text-sm font-semibold text-muted transition hover:border-black/25 hover:text-ink"
                  >
                    Load earlier messages
                  </button>
                </div>
              )}
              {messages.length === 0 && (
                <p className="py-10 text-center text-muted">
                  No messages yet — start the conversation 💬
                </p>
              )}
              {messages.map((m) => {
                const mine = String(m.author?._id) === String(user._id);
                return (
                  <div
                    key={m._id}
                    className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    {!mine && <Avatar user={m.author} size={32} />}
                    <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                      {!mine && (
                        <span className="ml-1 text-xs font-bold text-muted">
                          {m.author?.displayName || "Someone"}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-[15px] ${
                          mine
                            ? "bg-sage-500 text-white"
                            : "bg-black/[0.04] text-ink"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      </div>
                      <span className="px-1 text-[11px] text-muted">
                        {format(new Date(m.createdAt), "h:mm a")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Typing indicator sits just above the composer. */}
        <div className="h-5 px-4 text-xs font-semibold text-muted">
          {typingText(typingNames)}
        </div>

        <div className="flex items-center gap-2 border-t border-black/5 p-3">
          <input
            className="input"
            placeholder="Message your neighborhood…"
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn-primary" onClick={send} disabled={!draft.trim()}>
            Send
          </button>
        </div>
      </div>
    </Layout>
  );
}
