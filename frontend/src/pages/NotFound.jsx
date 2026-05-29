// pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <i className="bi bi-tv" style={{ fontSize: "5rem", color: "var(--yt-text-tertiary)", marginBottom: 16, display: "block" }} />
      <p className="not-found-code">404</p>
      <p className="not-found-msg">
        This page doesn't exist — maybe the video was deleted or the URL is wrong.
      </p>
      <Link to="/" className="btn btn-primary">
        <i className="bi bi-house-fill" /> Go Home
      </Link>
    </div>
  );
}