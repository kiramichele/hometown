import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      await register(email, password, displayName);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>Hometown</h1>
      <h2>Create an account</h2>
      <input
        style={inputStyle}
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <input
        style={inputStyle}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={inputStyle}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button style={buttonStyle} onClick={handleSubmit}>
        Register
      </button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>
        Have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 10,
  marginBottom: 10,
  boxSizing: "border-box",
};
const buttonStyle = {
  width: "100%",
  padding: 10,
  cursor: "pointer",
};
