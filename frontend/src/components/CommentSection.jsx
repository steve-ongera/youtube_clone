import { useState, useEffect } from "react";
import { commentAPI } from "../utils/api";

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)          return "just now";
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentItem({ comment, videoId, onReply }) {
  const [showReplies, setShowReplies] = useState(false);
  const initial = comment.author?.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="comment-item">
      <div className="avatar-placeholder">{initial}</div>
      <div className="comment-body" style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{comment.author?.username}</strong>
          <small>{timeAgo(comment.created_at)}</small>
        </div>
        <p style={{ marginTop: 4 }}>{comment.text}</p>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button
            onClick={() => onReply(comment.id, comment.author?.username)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ↩ Reply
          </button>
          {comment.reply_count > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.8rem", cursor: "pointer" }}
            >
              {showReplies ? "▲ Hide" : `▼ ${comment.reply_count} replies`}
            </button>
          )}
        </div>

        {/* Replies */}
        {showReplies && comment.replies?.length > 0 && (
          <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
            {comment.replies.map((reply) => (
              <div key={reply.id} className="comment-item" style={{ marginBottom: 12 }}>
                <div className="avatar-placeholder" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                  {reply.author?.username?.[0]?.toUpperCase()}
                </div>
                <div className="comment-body">
                  <div style={{ display: "flex", gap: 8 }}>
                    <strong style={{ fontSize: "0.82rem" }}>{reply.author?.username}</strong>
                    <small>{timeAgo(reply.created_at)}</small>
                  </div>
                  <p style={{ fontSize: "0.88rem", marginTop: 2 }}>{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ videoId }) {
  const [comments, setComments]     = useState([]);
  const [text, setText]             = useState("");
  const [loading, setLoading]       = useState(true);
  const [replyTo, setReplyTo]       = useState(null); // { id, username }
  const [submitting, setSubmitting] = useState(false);
  const isLoggedIn                  = !!localStorage.getItem("access_token");

  useEffect(() => {
    commentAPI.list(videoId)
      .then((res) => setComments(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [videoId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const payload = { text };
      if (replyTo) payload.parent = replyTo.id;
      const { data } = await commentAPI.create(videoId, payload);
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), data], reply_count: (c.reply_count || 0) + 1 }
              : c
          )
        );
      } else {
        setComments((prev) => [data, ...prev]);
      }
      setText("");
      setReplyTo(null);
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ marginTop: 28 }}>
      <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h3>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit}>
          {replyTo && (
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              Replying to <strong>@{replyTo.username}</strong>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem" }}
              >
                ✕ Cancel
              </button>
            </div>
          )}
          <div className="comment-input-row">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Add a comment..."}
              rows={1}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!text.trim() || submitting}
              style={{ alignSelf: "flex-end" }}
            >
              {submitting ? "…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: 16 }}>
          <a href="/login" style={{ color: "var(--accent)" }}>Sign in</a> to comment.
        </p>
      )}

      {loading && <div className="spinner" style={{ width: 24, height: 24, margin: "20px 0" }} />}

      <div style={{ marginTop: 8 }}>
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            videoId={videoId}
            onReply={(id, username) => setReplyTo({ id, username })}
          />
        ))}
      </div>

      {!loading && comments.length === 0 && (
        <p className="empty-msg">No comments yet. Be the first!</p>
      )}
    </section>
  );
}