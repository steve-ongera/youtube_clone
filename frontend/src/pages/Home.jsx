import { useState, useEffect } from "react";
import { videoAPI, categoryAPI } from "../utils/api";
import VideoCard from "../components/VideoCard";

export default function Home() {
  const [videos,     setVideos]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Load categories once
  useEffect(() => {
    categoryAPI.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // Load videos when filter changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = activeSlug ? { category__slug: activeSlug } : {};
    videoAPI.list(params)
      .then((res) => setVideos(res.data.results || res.data))
      .catch(() => setError("Failed to load videos."))
      .finally(() => setLoading(false));
  }, [activeSlug]);

  return (
    <div>
      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 20, scrollbarWidth: "none" }}>
        <button
          className={`btn ${!activeSlug ? "btn-primary" : "btn-ghost"}`}
          style={{ flexShrink: 0 }}
          onClick={() => setActiveSlug(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`btn ${activeSlug === cat.slug ? "btn-primary" : "btn-ghost"}`}
            style={{ flexShrink: 0 }}
            onClick={() => setActiveSlug(cat.slug === activeSlug ? null : cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading && <div className="spinner" />}
      {error   && <p className="error-msg">{error}</p>}

      {!loading && !error && (
        videos.length > 0
          ? <div className="video-grid">
              {videos.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          : <p className="empty-msg">No videos found.</p>
      )}
    </div>
  );
}