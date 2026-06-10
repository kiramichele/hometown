import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("resident@burgaw.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-sage-600">
            Hometown
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            Welcome back to Burgaw 👋
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-3 p-6">
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          No account?{" "}
          <Link to="/register" className="font-bold text-sage-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
