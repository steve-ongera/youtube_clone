// pages/Home.jsx
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
    categoryAPI.list()
      .then((res) => {
        const data = res.data;
        setCategories(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(() => {});
  }, []);

  // Load videos when filter changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = activeSlug ? { category__slug: activeSlug } : {};
    videoAPI.list(params)
      .then((res) => {
        const data = res.data;
        setVideos(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? "Failed to load videos.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [activeSlug]);

  return (
    <div>
      {/* Category chips */}
      <div className="chip-bar">
        <button
          className={`chip ${!activeSlug ? "active" : ""}`}
          onClick={() => setActiveSlug(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${activeSlug === cat.slug ? "active" : ""}`}
            onClick={() => setActiveSlug(cat.slug === activeSlug ? null : cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-state">
          <i className="bi bi-exclamation-circle" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
          {error}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        videos.length > 0 ? (
          <div className="video-grid">
            {videos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-camera-video-off" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }} />
            No videos found.
          </div>
        )
      )}
    </div>
  );
}