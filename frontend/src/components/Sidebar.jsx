// components/Sidebar.jsx
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "bi-house-fill",       label: "Home",      to: "/" },
  { icon: "bi-fire",             label: "Trending",  to: "/search?sort=trending" },
  { icon: "bi-collection-play",  label: "Feed",      to: "/feed" },
  { icon: "bi-collection",       label: "Playlists", to: "/playlists" },
  { icon: "bi-clock-history",    label: "History",   to: "/history" },
];

const EXPLORE = [
  { icon: "bi-controller",       label: "Gaming",  to: "/search?category=gaming" },
  { icon: "bi-music-note-beamed",label: "Music",   to: "/search?category=music" },
  { icon: "bi-film",             label: "Film",    to: "/search?category=film" },
  { icon: "bi-eyedropper",       label: "Science", to: "/search?category=science" },
  { icon: "bi-trophy",           label: "Sports",  to: "/search?category=sports" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        {NAV_ITEMS.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <span className="sidebar-link-icon">
              <i className={`bi ${icon}`} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-title">Explore</p>
        {EXPLORE.map(({ icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            <span className="sidebar-link-icon">
              <i className={`bi ${icon}`} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}