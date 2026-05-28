import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { videoAPI } from "../utils/api";
import VideoCard from "../components/VideoCard";

const SORT_OPTIONS = [
  { label: "Newest",    value: "-created_at" },
  { label: "Most Viewed", value: "-views" },
  { label: "Most Liked", value: "-like_count" },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query    = searchParams.get("q") || "";
  const sort     = searchParams.get("sort") || "-created_at";

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
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.1rem" }}>
          {query ? <>Results for <em style={{ color: "var(--accent)" }}>"{query}"</em></> : "Browse All"}
        </h2>

        {/* Sort */}
        <div style={{ display: "flex", gap: 8 }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`btn ${sort === opt.value ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.8rem" }}
              onClick={() => updateSort(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && <div className="spinner" />}
      {error   && <p className="error-msg">{error}</p>}

      {!loading && !error && (
        <>
          {videos.length > 0
            ? <div className="video-grid">
                {videos.map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
            : query
              ? <p className="empty-msg">No results found for "{query}".</p>
              : <p className="empty-msg">Enter a search term above.</p>
          }

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button className="btn btn-ghost" onClick={loadMore}>Load more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}