import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "5rem", marginBottom: 16 }}>📺</div>
      <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "2rem", marginBottom: 8 }}>404</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
        This page doesn't exist — maybe the video was deleted or the URL is wrong.
      </p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}