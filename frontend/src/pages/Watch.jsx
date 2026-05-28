import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { videoAPI } from "../utils/api";
import CommentSection from "../components/CommentSection";
import VideoCard      from "../components/VideoCard";

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function Watch() {
  const { id }                  = useParams();
  const navigate                = useNavigate();
  const [video,    setVideo]    = useState(null);
  const [related,  setRelated]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [reaction, setReaction] = useState(null);
  const [likes,    setLikes]    = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const isLoggedIn              = !!localStorage.getItem("access_token");

  useEffect(() => {
    setLoading(true);
    setError(null);
    videoAPI.get(id)
      .then(({ data }) => {
        setVideo(data);
        setReaction(data.user_reaction);
        setLikes(data.like_count);
        // Fetch related
        return videoAPI.list({ search: data.title.split(" ")[0], page: 1 });
      })
      .then(({ data }) => setRelated((data.results || data).filter((v) => v.id !== Number(id)).slice(0, 12)))
      .catch(() => setError("Video not found or unavailable."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReact(type) {
    if (!isLoggedIn) return navigate("/login");
    try {
      const { data } = await videoAPI.react(id, type);
      setReaction(data.reaction);
      setLikes(data.likes);
    } catch { /* ignore */ }
  }

  if (loading) return <div className="spinner" />;
  if (error)   return <p className="error-msg">{error}</p>;
  if (!video)  return null;

  const uploaderInitial = video.uploader?.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="watch-layout">
      {/* ── Left column ── */}
      <div>
        {/* Player */}
        <div className="video-player-wrapper">
          <video
            src={video.video_url}
            controls
            autoPlay
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* Title & actions */}
        <div className="video-info">
          <h1>{video.title}</h1>
          <div className="video-meta-row">
            <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              {formatViews(video.views)} views
            </span>
            <div className="video-actions">
              <button
                className={`btn ${reaction === "like" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => handleReact("like")}
              >
                👍 {likes}
              </button>
              <button
                className={`btn ${reaction === "dislike" ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => handleReact("dislike")}
              >
                👎
              </button>
              <button className="btn btn-ghost">↗ Share</button>
            </div>
          </div>
        </div>

        {/* Channel info */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0", padding: "14px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <Link to={`/channel/${video.uploader?.id}`}>
            {video.uploader?.avatar_url
              ? <img src={video.uploader.avatar_url} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} alt="" />
              : <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: "1rem" }}>{uploaderInitial}</div>
            }
          </Link>
          <div style={{ flex: 1 }}>
            <Link to={`/channel/${video.uploader?.id}`} style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>
              {video.uploader?.username}
            </Link>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {video.uploader?.subscriber_count?.toLocaleString()} subscribers
            </p>
          </div>
          {isLoggedIn && (
            <button className="btn btn-primary">Subscribe</button>
          )}
        </div>

        {/* Description */}
        <div
          style={{
            background: "var(--surface)", borderRadius: "var(--radius)", padding: "12px 16px",
            fontSize: "0.9rem", lineHeight: 1.7, cursor: "pointer",
            maxHeight: descOpen ? "none" : "80px", overflow: "hidden", position: "relative",
          }}
          onClick={() => setDescOpen((o) => !o)}
        >
          <p style={{ whiteSpace: "pre-wrap" }}>{video.description || "No description."}</p>
          {!descOpen && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "linear-gradient(transparent, var(--surface))", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, fontSize: "0.8rem", color: "var(--accent)" }}>
              Show more ▼
            </div>
          )}
        </div>

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div className="tag-row" style={{ marginTop: 10 }}>
            {video.tags.map((t) => <span key={t.id} className="tag-pill">#{t.name}</span>)}
          </div>
        )}

        {/* Comments */}
        <CommentSection videoId={id} />
      </div>

      {/* ── Right column — related ── */}
      <aside>
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.95rem", marginBottom: 14, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Up next
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {related.map((v) => (
            <div key={v.id} style={{ display: "flex", gap: 10, cursor: "pointer" }} onClick={() => navigate(`/watch/${v.id}`)}>
              {/* Mini thumb */}
              <div style={{ width: 130, flexShrink: 0, aspectRatio: "16/9", background: "var(--surface)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</div>
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {v.title}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>{v.uploader?.username}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatViews(v.views)} views</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}