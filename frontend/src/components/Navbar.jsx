import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function useAuth() {
  const token = localStorage.getItem("access_token");
  const raw   = localStorage.getItem("user");
  const user  = raw ? JSON.parse(raw) : null;
  return { isLoggedIn: !!token, user };
}

export default function Navbar() {
  const [query, setQuery]       = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate                = useNavigate();
  const { isLoggedIn, user }    = useAuth();

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  const initial = user?.username?.[0]?.toUpperCase() || "U";

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        ▶ <span>ViewTube</span>
      </Link>

      {/* Search bar */}
      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos..."
        />
        <button type="submit" className="btn btn-secondary" style={{ borderRadius: 20, padding: "8px 14px" }}>
          🔍
        </button>
      </form>

      {/* Right actions */}
      <div className="navbar-actions">
        {isLoggedIn ? (
          <>
            <Link to="/upload" className="btn btn-primary">+ Upload</Link>

            {/* Avatar dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{ background: "none", border: "none", padding: 0 }}
              >
                <div className="avatar-placeholder" style={{ width: 34, height: 34, fontSize: "0.85rem" }}>
                  {initial}
                </div>
              </button>

              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", minWidth: 160,
                  boxShadow: "var(--shadow)", zIndex: 200, overflow: "hidden",
                }}>
                  {[
                    { label: "My Channel",  path: `/channel/${user?.id}` },
                    { label: "History",     path: "/history" },
                    { label: "Playlists",   path: "/playlists" },
                  ].map(({ label, path }) => (
                    <Link
                      key={path} to={path}
                      onClick={() => setMenuOpen(false)}
                      style={{ display: "block", padding: "10px 16px", fontSize: "0.875rem", color: "var(--text-muted)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {label}
                    </Link>
                  ))}
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 16px",
                      background: "none", border: "none", color: "var(--accent)",
                      fontSize: "0.875rem", cursor: "pointer",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login"    className="btn btn-ghost">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Join</Link>
          </>
        )}
      </div>
    </nav>
  );
}