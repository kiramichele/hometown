import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Hometown</h1>
        <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Log out
        </button>
      </div>

      <p>
        You're logged in as <strong>{user.displayName}</strong> ({user.email}).
      </p>
      <p>
        Role: <strong>{user.role}</strong>
      </p>

      <hr style={{ margin: "24px 0" }} />
      <p style={{ color: "#666" }}>
        Phase 0 complete — auth works end to end. Next up: the posts feed
        (Phase 1).
      </p>
    </div>
  );
}
