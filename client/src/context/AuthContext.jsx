import { createContext, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, restore the session by hitting /me.
  useEffect(() => {
    async function restore() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.get("/auth/me");
        setUser(user);
      } catch {
        tokenStore.clear();
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const { token, user } = await api.post("/auth/login", { email, password });
    tokenStore.set(token);
    setUser(user);
  }

  async function register(email, password, displayName) {
    const { token, user } = await api.post("/auth/register", {
      email,
      password,
      displayName,
    });
    tokenStore.set(token);
    setUser(user);
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
