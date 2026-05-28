import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "🏠", label: "Home",      to: "/" },
  { icon: "🔥", label: "Trending",  to: "/search?sort=trending" },
  { icon: "📺", label: "Feed",      to: "/feed" },
  { icon: "📋", label: "Playlists", to: "/playlists" },
  { icon: "🕓", label: "History",   to: "/history" },
];

const EXPLORE = [
  { icon: "🎮", label: "Gaming",  to: "/search?category=gaming" },
  { icon: "🎵", label: "Music",   to: "/search?category=music" },
  { icon: "🎬", label: "Film",    to: "/search?category=film" },
  { icon: "🔬", label: "Science", to: "/search?category=science" },
  { icon: "⚽", label: "Sports",  to: "/search?category=sports" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <section>
        {NAV_ITEMS.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <span style={{ fontSize: "1.1rem" }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </section>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 16px" }} />

      <p style={{ padding: "4px 20px", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Explore
      </p>
      <section>
        {EXPLORE.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <span style={{ fontSize: "1.1rem" }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </section>
    </aside>
  );
}