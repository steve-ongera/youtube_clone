// pages/Watch.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { videoAPI } from "../utils/api";
import CommentSection from "../components/CommentSection";

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
        return videoAPI.list({ search: data.title.split(" ")[0], page: 1 });
      })
      .then(({ data }) =>
        setRelated((data.results || data).filter((v) => v.id !== Number(id)).slice(0, 12))
      )
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

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div className="error-state">
      <i className="bi bi-exclamation-circle" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
      {error}
    </div>
  );

  if (!video) return null;

  const uploaderInitial = video.uploader?.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="watch-layout">
      {/* ── Primary column ── */}
      <div className="watch-primary">

        {/* Player */}
        <div className="watch-player-wrapper">
          <video
            src={video.video_url}
            controls
            autoPlay
          />
        </div>

        {/* Title */}
        <h1 className="watch-title">{video.title}</h1>

        {/* Action row */}
        <div className="watch-action-row">
          <div className="watch-action-left">
            <span className="watch-views">
              {formatViews(video.views)} views
            </span>
          </div>
          <div className="watch-action-left">
            {/* Like / Dislike pill */}
            <div className="btn-pill-group">
              <button
                className={`btn-pill ${reaction === "like" ? "active" : ""}`}
                onClick={() => handleReact("like")}
                title="Like"
              >
                <i className="bi bi-hand-thumbs-up" /> {likes}
              </button>
              <div className="btn-pill-divider" />
              <button
                className={`btn-pill ${reaction === "dislike" ? "active" : ""}`}
                onClick={() => handleReact("dislike")}
                title="Dislike"
              >
                <i className="bi bi-hand-thumbs-down" />
              </button>
            </div>

            <button className="btn btn-action">
              <i className="bi bi-share" /> Share
            </button>

            <button className="btn btn-action">
              <i className="bi bi-three-dots-vertical" />
            </button>
          </div>
        </div>

        {/* Channel row */}
        <div className="watch-channel-row">
          <Link to={`/channel/${video.uploader?.id}`} className="watch-channel-avatar">
            {video.uploader?.avatar_url ? (
              <img src={video.uploader.avatar_url} alt={video.uploader.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "1rem" }}>
                {uploaderInitial}
              </div>
            )}
          </Link>

          <div className="watch-channel-info">
            <Link to={`/channel/${video.uploader?.id}`} className="watch-channel-name">
              {video.uploader?.username}
            </Link>
            <p className="watch-channel-subs">
              {video.uploader?.subscriber_count?.toLocaleString()} subscribers
            </p>
          </div>

          {isLoggedIn && (
            <button className="btn btn-subscribe">Subscribe</button>
          )}
        </div>

        {/* Description */}
        <div
          className="watch-description"
          style={{ maxHeight: descOpen ? "none" : "80px", position: "relative" }}
          onClick={() => setDescOpen((o) => !o)}
        >
          <p className="watch-description-text">
            {video.description || "No description."}
          </p>
          {!descOpen && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: 36, background: "linear-gradient(transparent, rgba(255,255,255,.05))",
              display: "flex", alignItems: "flex-end", justifyContent: "flex-start",
              paddingBottom: 6, paddingLeft: 12,
              fontSize: "0.8rem", fontWeight: 500, color: "var(--yt-text)",
            }}>
              <i className="bi bi-chevron-down" style={{ marginRight: 4 }} /> Show more
            </div>
          )}
          {descOpen && (
            <div style={{ marginTop: 8, fontSize: "0.8rem", fontWeight: 500, color: "var(--yt-text)" }}>
              <i className="bi bi-chevron-up" style={{ marginRight: 4 }} /> Show less
            </div>
          )}
        </div>

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div className="watch-tags">
            {video.tags.map((t) => (
              <span key={t.id} className="tag-pill">#{t.name}</span>
            ))}
          </div>
        )}

        {/* Comments */}
        <CommentSection videoId={id} />
      </div>

      {/* ── Secondary column — related ── */}
      <aside className="watch-secondary">
        <div style={{ marginBottom: 12, fontSize: "0.9375rem", fontWeight: 500 }}>
          Up next
        </div>
        {related.map((v) => (
          <div
            key={v.id}
            className="related-item"
            onClick={() => navigate(`/watch/${v.id}`)}
          >
            <div className="related-thumb">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt={v.title} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--yt-text-tertiary)", fontSize: "1.5rem" }}>
                  <i className="bi bi-play-circle" />
                </div>
              )}
              {v.duration && (
                <span className="video-duration">
                  {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, "0")}
                </span>
              )}
            </div>
            <div className="related-info">
              <p className="related-title">{v.title}</p>
              <p className="related-channel">{v.uploader?.username}</p>
              <p className="related-views">{formatViews(v.views)} views</p>
            </div>
          </div>
        ))}

        {related.length === 0 && !loading && (
          <div className="empty-state" style={{ padding: "24px 0" }}>
            <i className="bi bi-collection-play" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
            No related videos
          </div>
        )}
      </aside>
    </div>
  );
}