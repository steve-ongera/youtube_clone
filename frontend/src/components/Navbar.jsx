// components/Navbar.jsx
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
      {/* Left: hamburger + logo */}
      <div className="navbar-left">
        <button className="navbar-hamburger" aria-label="Menu">
          <span /><span /><span />
        </button>
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">
            <i className="bi bi-youtube" />
          </span>
          <span className="navbar-logo-text">
            View<span>Tube</span>
          </span>
        </Link>
      </div>

      {/* Center: search */}
      <div className="navbar-center">
        <form className="navbar-search-form" onSubmit={handleSearch}>
          <input
            className="navbar-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search videos"
          />
          <button type="submit" className="navbar-search-btn" aria-label="Submit search">
            <i className="bi bi-search" />
          </button>
        </form>
        <button className="navbar-mic-btn" aria-label="Search with voice">
          <i className="bi bi-mic" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="navbar-right">
        {isLoggedIn ? (
          <>
            <Link to="/upload" className="navbar-upload-btn">
              <i className="bi bi-camera-video" />
              <span>Upload</span>
            </Link>

            <button className="navbar-icon-btn" aria-label="Notifications">
              <i className="bi bi-bell" />
            </button>

            {/* Avatar dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                aria-label="Account menu"
              >
                <div className="navbar-avatar">
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initial
                  }
                </div>
              </button>

              {menuOpen && (
                <div className="navbar-dropdown">
                  {[
                    { label: "My Channel", icon: "bi-person-circle", path: `/channel/${user?.id}` },
                    { label: "History",    icon: "bi-clock-history",  path: "/history" },
                    { label: "Playlists",  icon: "bi-collection",     path: "/playlists" },
                  ].map(({ label, icon, path }) => (
                    <Link
                      key={path}
                      to={path}
                      className="navbar-dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className={`bi ${icon}`} />
                      {label}
                    </Link>
                  ))}
                  <div className="navbar-dropdown-divider" />
                  <button
                    onClick={handleLogout}
                    className="navbar-dropdown-item"
                    style={{ width: "100%", textAlign: "left", color: "var(--yt-red)" }}
                  >
                    <i className="bi bi-box-arrow-right" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-signin-btn">
              <i className="bi bi-person-circle" />
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}