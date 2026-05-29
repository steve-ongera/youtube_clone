// pages/Channel.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { channelAPI } from "../utils/api";
import VideoCard from "../components/VideoCard";

const TABS = ["Videos", "About"];

export default function Channel() {
  const { id }                       = useParams();
  const [channel,    setChannel]     = useState(null);
  const [videos,     setVideos]      = useState([]);
  const [activeTab,  setActiveTab]   = useState("Videos");
  const [loading,    setLoading]     = useState(true);
  const [subscribed, setSubscribed]  = useState(false);
  const [subCount,   setSubCount]    = useState(0);
  const [subLoading, setSubLoading]  = useState(false);
  const isLoggedIn                   = !!localStorage.getItem("access_token");

  useEffect(() => {
    setLoading(true);
    Promise.all([channelAPI.get(id), channelAPI.videos(id)])
      .then(([chanRes, vidRes]) => {
        setChannel(chanRes.data);
        setSubscribed(chanRes.data.is_subscribed);
        setSubCount(chanRes.data.subscriber_count);
        setVideos(vidRes.data.results || vidRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubscribe() {
    if (!isLoggedIn) return (window.location.href = "/login");
    setSubLoading(true);
    try {
      const { data } = await channelAPI.subscribe(id);
      setSubscribed(data.subscribed);
      setSubCount(data.subscriber_count);
    } catch { /* ignore */ }
    finally { setSubLoading(false); }
  }

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );

  if (!channel) return (
    <div className="error-state">
      <i className="bi bi-person-x" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
      Channel not found.
    </div>
  );

  const initial = channel.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="channel-page">

      {/* Banner */}
      {channel.banner_url ? (
        <img src={channel.banner_url} className="channel-banner" alt="Channel banner" />
      ) : (
        <div className="channel-banner" style={{ background: "linear-gradient(135deg, var(--yt-surface) 0%, #1a1a2e 100%)" }} />
      )}

      {/* Header */}
      <div className="channel-header">
        <div className="channel-avatar-wrap">
          {channel.avatar_url ? (
            <img src={channel.avatar_url} className="channel-avatar" alt={channel.username} />
          ) : (
            <div
              className="avatar-placeholder channel-avatar"
              style={{ width: 80, height: 80, fontSize: "1.75rem" }}
            >
              {initial}
            </div>
          )}
        </div>

        <div className="channel-info-wrap">
          <h1 className="channel-name">{channel.username}</h1>
          <p className="channel-handle">@{channel.username}</p>
          <p className="channel-stats">
            {subCount.toLocaleString()} subscribers · {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
          {channel.bio && (
            <p className="channel-bio">{channel.bio}</p>
          )}
        </div>

        <button
          className={`btn ${subscribed ? "btn-subscribed" : "btn-subscribe"}`}
          onClick={handleSubscribe}
          disabled={subLoading}
        >
          {subLoading ? (
            <div className="spinner spinner--sm" style={{ borderTopColor: subscribed ? "var(--yt-text)" : "#0f0f0f" }} />
          ) : subscribed ? (
            <><i className="bi bi-bell-fill" /> Subscribed</>
          ) : (
            <><i className="bi bi-bell" /> Subscribe</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="channel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`channel-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Videos" && (
        videos.length > 0 ? (
          <div className="video-grid">
            {videos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-camera-video-off" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }} />
            This channel has no public videos yet.
          </div>
        )
      )}

      {activeTab === "About" && (
        <div style={{ maxWidth: 680, padding: "8px 0" }}>
          {channel.bio ? (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: 8, color: "var(--yt-text)" }}>Description</h3>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--yt-text-secondary)", whiteSpace: "pre-wrap" }}>
                {channel.bio}
              </p>
            </div>
          ) : (
            <p style={{ color: "var(--yt-text-secondary)", fontSize: "0.9375rem" }}>No description provided.</p>
          )}

          {channel.website && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 500, marginBottom: 8, color: "var(--yt-text)" }}>Links</h3>
              <a
                href={channel.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#3ea6ff", fontSize: "0.9375rem" }}
              >
                <i className="bi bi-link-45deg" />
                {channel.website}
              </a>
            </div>
          )}

          <div style={{ marginTop: 24, color: "var(--yt-text-secondary)", fontSize: "0.875rem" }}>
            <p>
              <i className="bi bi-person-check" style={{ marginRight: 8 }} />
              {subCount.toLocaleString()} subscribers
            </p>
            <p style={{ marginTop: 6 }}>
              <i className="bi bi-play-circle" style={{ marginRight: 8 }} />
              {videos.length} video{videos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}