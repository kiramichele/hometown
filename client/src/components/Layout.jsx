import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import NotificationBell from "./NotificationBell.jsx";

// Nav tab styling — sage pill when active, muted otherwise.
function navClass({ isActive }) {
  return `rounded-full px-3 py-1.5 text-sm font-bold transition ${
    isActive
      ? "bg-sage-100 text-sage-700"
      : "text-muted hover:bg-black/5 hover:text-ink"
  }`;
}

// App shell: a sticky warm header with the brand, page nav, and the signed-in
// user. Every signed-in page renders inside this centered column.
export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tight text-sage-600">
              Hometown
            </span>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navClass}>
                Feed
              </NavLink>
              <NavLink to="/events" className={navClass}>
                Events
              </NavLink>
              <NavLink to="/board" className={navClass}>
                Board
              </NavLink>
              <NavLink to="/market" className={navClass}>
                Market
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold leading-tight">
                {user.displayName}
              </div>
              <div className="text-xs capitalize text-muted">{user.role}</div>
            </div>
            <Avatar user={user} size={38} />
            <button
              onClick={logout}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition hover:bg-black/5 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
