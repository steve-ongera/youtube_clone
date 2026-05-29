// components/CommentSection.jsx
import { useState, useEffect } from "react";
import { commentAPI } from "../utils/api";

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentItem({ comment, onReply }) {
  const [showReplies, setShowReplies] = useState(false);
  const initial = comment.author?.username?.[0]?.toUpperCase() || "U";

  return (
    <div className="comment-item">
      {/* Avatar */}
      <div className="comment-avatar">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.username}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : initial}
      </div>

      {/* Body */}
      <div className="comment-body">
        <div className="comment-author-row">
          <span className="comment-author">{comment.author?.username}</span>
          <span className="comment-date">{timeAgo(comment.created_at)}</span>
        </div>

        <p className="comment-text">{comment.text}</p>

        {/* Actions */}
        <div className="comment-actions">
          <button className="comment-action-btn">
            <i className="bi bi-hand-thumbs-up" />
          </button>
          <button className="comment-action-btn">
            <i className="bi bi-hand-thumbs-down" />
          </button>
          <button
            className="comment-action-btn"
            onClick={() => onReply(comment.id, comment.author?.username)}
          >
            Reply
          </button>

          {comment.reply_count > 0 && (
            <button
              className="replies-toggle"
              onClick={() => setShowReplies((v) => !v)}
            >
              <i className={`bi bi-chevron-${showReplies ? "up" : "down"}`} />
              {showReplies ? "Hide replies" : `${comment.reply_count} ${comment.reply_count === 1 ? "reply" : "replies"}`}
            </button>
          )}
        </div>

        {/* Replies */}
        {showReplies && comment.replies?.length > 0 && (
          <div className="replies-container">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="comment-item" style={{ marginBottom: 16 }}>
                <div className="comment-avatar" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                  {reply.author?.avatar_url ? (
                    <img
                      src={reply.author.avatar_url}
                      alt={reply.author.username}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : reply.author?.username?.[0]?.toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-author-row">
                    <span className="comment-author" style={{ fontSize: "0.8125rem" }}>
                      {reply.author?.username}
                    </span>
                    <span className="comment-date">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="comment-text" style={{ fontSize: "0.875rem" }}>{reply.text}</p>
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
  const [comments,   setComments]   = useState([]);
  const [text,       setText]       = useState("");
  const [loading,    setLoading]    = useState(true);
  const [replyTo,    setReplyTo]    = useState(null); // { id, username }
  const [submitting, setSubmitting] = useState(false);
  const [focused,    setFocused]    = useState(false);
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
      setFocused(false);
    } catch {
      alert("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="comments-section">
      {/* Header */}
      <h2 className="comments-header">
        {comments.length.toLocaleString()} Comment{comments.length !== 1 ? "s" : ""}
      </h2>

      {/* Composer */}
      {isLoggedIn ? (
        <form className="comment-composer" onSubmit={handleSubmit}>
          <div className="comment-avatar">
            {localStorage.getItem("user")
              ? JSON.parse(localStorage.getItem("user"))?.username?.[0]?.toUpperCase()
              : "U"
            }
          </div>

          <div style={{ flex: 1 }}>
            {/* Reply indicator */}
            {replyTo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: "0.8125rem", color: "var(--yt-text-secondary)" }}>
                Replying to <strong style={{ color: "var(--yt-text)" }}>@{replyTo.username}</strong>
                <button
                  type="button"
                  onClick={() => { setReplyTo(null); setFocused(false); }}
                  className="comment-action-btn"
                  style={{ padding: "2px 6px" }}
                >
                  <i className="bi bi-x" />
                  Cancel
                </button>
              </div>
            )}

            <div className="comment-input-wrap">
              <textarea
                className="comment-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Add a comment…"}
                rows={focused ? 3 : 1}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
            </div>

            {(focused || text.trim()) && (
              <div className="comment-form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setText(""); setFocused(false); setReplyTo(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-subscribe"
                  disabled={!text.trim() || submitting}
                >
                  {submitting ? (
                    <><div className="spinner spinner--sm" style={{ borderTopColor: "#0f0f0f" }} /> Posting…</>
                  ) : "Comment"}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p style={{ color: "var(--yt-text-secondary)", fontSize: "0.875rem", marginBottom: 24 }}>
          <a href="/login" style={{ color: "#3ea6ff" }}>Sign in</a> to add a comment.
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="spinner-wrap" style={{ padding: "24px 0" }}>
          <div className="spinner spinner--sm" />
        </div>
      )}

      {/* Comments list */}
      <div>
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            videoId={videoId}
            onReply={(id, username) => { setReplyTo({ id, username }); setFocused(true); }}
          />
        ))}
      </div>

      {/* Empty */}
      {!loading && comments.length === 0 && (
        <div className="empty-state" style={{ padding: "32px 0" }}>
          <i className="bi bi-chat-left" style={{ fontSize: "2rem", display: "block", marginBottom: 8 }} />
          No comments yet. Be the first!
        </div>
      )}
    </section>
  );
}