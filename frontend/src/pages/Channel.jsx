import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { channelAPI } from "../utils/api";
import VideoCard from "../components/VideoCard";

export default function Channel() {
  const { id }                          = useParams();
  const [channel,     setChannel]       = useState(null);
  const [videos,      setVideos]        = useState([]);
  const [loading,     setLoading]       = useState(true);
  const [subscribed,  setSubscribed]    = useState(false);
  const [subCount,    setSubCount]      = useState(0);
  const [subLoading,  setSubLoading]    = useState(false);
  const isLoggedIn                      = !!localStorage.getItem("access_token");

  useEffect(() => {
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

  if (loading) return <div className="spinner" />;
  if (!channel) return <p className="error-msg">Channel not found.</p>;

  const initial = channel.username?.[0]?.toUpperCase() || "U";

  return (
    <div>
      {/* Banner */}
      {channel.banner_url
        ? <img src={channel.banner_url} className="channel-banner" alt="banner" />
        : <div className="channel-banner" style={{ background: "linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%)" }} />
      }

      {/* Header */}
      <div className="channel-header">
        {channel.avatar_url
          ? <img src={channel.avatar_url} className="channel-avatar" alt={channel.username} />
          : <div className="avatar-placeholder channel-avatar" style={{ width: 80, height: 80, fontSize: "1.6rem" }}>{initial}</div>
        }
        <div className="channel-info">
          <h1>{channel.username}</h1>
          <p>{subCount.toLocaleString()} subscribers · {videos.length} videos</p>
          {channel.bio && <p style={{ marginTop: 6, maxWidth: 500 }}>{channel.bio}</p>}
        </div>
        <button
          className={`btn ${subscribed ? "btn-secondary" : "btn-primary"}`}
          onClick={handleSubscribe}
          disabled={subLoading}
        >
          {subscribed ? "✓ Subscribed" : "Subscribe"}
        </button>
      </div>

      {/* Tabs (static, just Videos for now) */}
      <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 24, display: "flex", gap: 0 }}>
        {["Videos", "About"].map((tab) => (
          <button
            key={tab}
            style={{
              background: "none", border: "none", color: tab === "Videos" ? "var(--text)" : "var(--text-muted)",
              borderBottom: tab === "Videos" ? "2px solid var(--accent)" : "2px solid transparent",
              padding: "10px 18px", cursor: "pointer", fontFamily: "Outfit, sans-serif", fontWeight: 500,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Video grid */}
      {videos.length > 0
        ? <div className="video-grid">
            {videos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        : <p className="empty-msg">This channel has no public videos yet.</p>
      }
    </div>
  );
}