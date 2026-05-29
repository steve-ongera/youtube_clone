// components/VideoCard.jsx
import { useNavigate } from "react-router-dom";

function formatDuration(secs) {
  if (!secs) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)          return "just now";
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30)  return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}mo ago`;
  return `${Math.floor(diff / (86400 * 365))}y ago`;
}

export default function VideoCard({ video }) {
  const navigate = useNavigate();
  const { id, title, thumbnail_url, duration, views, created_at, uploader } = video;
  const initial = uploader?.username?.[0]?.toUpperCase() || "U";

  return (
    <article className="video-card" onClick={() => navigate(`/watch/${id}`)}>
      {/* Thumbnail */}
      <div className="video-card-thumb">
        {thumbnail_url ? (
          <img src={thumbnail_url} alt={title} loading="lazy" />
        ) : (
          <div className="video-card-thumb-placeholder">
            <i className="bi bi-play-circle" />
          </div>
        )}
        <span className="video-duration">{formatDuration(duration)}</span>
      </div>

      {/* Info row */}
      <div className="video-card-info">
        {uploader?.avatar_url ? (
          <div className="video-card-avatar">
            <img src={uploader.avatar_url} alt={uploader.username} />
          </div>
        ) : (
          <div
            className="avatar-placeholder video-card-avatar"
            style={{ width: 36, height: 36, fontSize: "0.875rem" }}
          >
            {initial}
          </div>
        )}

        <div className="video-card-text">
          <h3>{title}</h3>
          <p
            className="video-card-channel"
            onClick={(e) => { e.stopPropagation(); navigate(`/channel/${uploader?.id}`); }}
          >
            {uploader?.username}
          </p>
          <p className="video-card-meta">
            {formatViews(views)} views · {timeAgo(created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}