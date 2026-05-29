// pages/Search.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { videoAPI } from "../utils/api";
import VideoCard from "../components/VideoCard";

const SORT_OPTIONS = [
  { label: "Newest",      value: "-created_at" },
  { label: "Most Viewed", value: "-views" },
  { label: "Most Liked",  value: "-like_count" },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")    || "";
  const sort  = searchParams.get("sort") || "-created_at";

  const [videos,  setVideos]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setPage(1);
    videoAPI.list({ search: query, ordering: sort, page: 1 })
      .then(({ data }) => {
        setVideos(data.results || data);
        setHasMore(!!data.next);
      })
      .catch(() => setError("Search failed. Please try again."))
      .finally(() => setLoading(false));
  }, [query, sort]);

  async function loadMore() {
    const nextPage = page + 1;
    const { data } = await videoAPI.list({ search: query, ordering: sort, page: nextPage });
    setVideos((prev) => [...prev, ...(data.results || data)]);
    setHasMore(!!data.next);
    setPage(nextPage);
  }

  function updateSort(val) {
    setSearchParams((prev) => { prev.set("sort", val); return prev; });
  }

  return (
    <div className="search-page">
      {/* Header */}
      <div className="search-header">
        <p className="search-results-count">
          {query
            ? <>Results for <em style={{ color: "var(--yt-text)", fontStyle: "normal", fontWeight: 500 }}>"{query}"</em></>
            : "Browse All"
          }
        </p>

        {/* Sort chips */}
        <div style={{ display: "flex", gap: 8 }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`chip ${sort === opt.value ? "active" : ""}`}
              onClick={() => updateSort(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
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

      {/* Results */}
      {!loading && !error && (
        <>
          {videos.length > 0 ? (
            <div className="search-results">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          ) : query ? (
            <div className="empty-state">
              <i className="bi bi-search" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }} />
              No results found for "{query}".
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-camera-video" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }} />
              Enter a search term above.
            </div>
          )}

          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn btn-ghost" onClick={loadMore}>
                <i className="bi bi-arrow-down-circle" /> Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}