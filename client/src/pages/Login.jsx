import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("resident@burgaw.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>Hometown</h1>
      <h2>Log in</h2>
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
        Log in
      </button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>
        No account? <Link to="/register">Register</Link>
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
