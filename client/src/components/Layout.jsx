import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

// App shell: a sticky warm header with the brand + the signed-in user, and a
// centered content column. Every signed-in page renders inside this.
export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight text-sage-600">
              Hometown
            </span>
            <span className="text-sm font-semibold text-muted">Burgaw, NC</span>
          </div>

          <div className="flex items-center gap-3">
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
