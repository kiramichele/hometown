import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { NotificationsProvider } from "./context/NotificationsContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Feed from "./pages/Feed.jsx";
import Events from "./pages/Events.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import Board from "./pages/Board.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";

// A signed-in page = wrapped in ProtectedRoute (redirects to /login if needed).
function Protected({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Protected><Feed /></Protected>} />
              <Route path="/events" element={<Protected><Events /></Protected>} />
              <Route
                path="/events/:id"
                element={<Protected><EventDetail /></Protected>}
              />
              <Route path="/board" element={<Protected><Board /></Protected>} />
              <Route
                path="/market"
                element={<Protected><Marketplace /></Protected>}
              />
              <Route
                path="/market/:id"
                element={<Protected><ListingDetail /></Protected>}
              />
            </Routes>
          </BrowserRouter>
        </NotificationsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
