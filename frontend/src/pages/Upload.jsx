import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { videoAPI } from "../utils/api";

export default function Upload() {
  const navigate  = useNavigate();
  const videoRef  = useRef(null);
  const thumbRef  = useRef(null);

  const [form, setForm] = useState({
    title: "", description: "", visibility: "public", tag_names: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleThumb(e) {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!videoFile) return setError("Please select a video file.");
    if (!form.title.trim()) return setError("Title is required.");

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("title",       form.title);
    fd.append("description", form.description);
    fd.append("visibility",  form.visibility);
    fd.append("video_file",  videoFile);
    if (thumbFile) fd.append("thumbnail", thumbFile);
    form.tag_names.split(",")
      .map((t) => t.trim()).filter(Boolean)
      .forEach((t) => fd.append("tag_names", t));

    try {
      const { data } = await videoAPI.upload(fd);
      navigate(`/watch/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || "Upload failed.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.5rem", marginBottom: 28 }}>Upload Video</h2>

      <form onSubmit={handleSubmit}>
        {/* Video file drop zone */}
        <div
          onClick={() => videoRef.current.click()}
          style={{
            border: `2px dashed ${videoFile ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)", padding: "40px 20px",
            textAlign: "center", cursor: "pointer", marginBottom: 24,
            background: videoFile ? "var(--accent-muted)" : "transparent",
            transition: "all 0.2s",
          }}
        >
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => setVideoFile(e.target.files[0])} />
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎬</div>
          {videoFile
            ? <p style={{ color: "var(--accent)", fontWeight: 500 }}>✓ {videoFile.name}</p>
            : <>
                <p style={{ fontWeight: 500 }}>Click to select a video</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>MP4, MOV, AVI, MKV — up to 2 GB</p>
              </>
          }
        </div>

        {/* Thumbnail */}
        <div className="form-group">
          <label>Thumbnail (optional)</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {thumbPreview && (
              <img src={thumbPreview} alt="thumb" style={{ width: 120, aspectRatio: "16/9", objectFit: "cover", borderRadius: "var(--radius)" }} />
            )}
            <button type="button" className="btn btn-ghost" onClick={() => thumbRef.current.click()}>
              {thumbPreview ? "Change image" : "Choose image"}
            </button>
            <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumb} />
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Enter a descriptive title" />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description" value={form.description} onChange={handleChange}
            rows={4} placeholder="Tell viewers about your video..."
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>Tags <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>(comma-separated)</span></label>
          <input name="tag_names" value={form.tag_names} onChange={handleChange} placeholder="e.g. tutorial, react, coding" />
        </div>

        {/* Visibility */}
        <div className="form-group">
          <label>Visibility</label>
          <select name="visibility" value={form.visibility} onChange={handleChange}>
            <option value="public">🌍 Public</option>
            <option value="unlisted">🔗 Unlisted</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>

        {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

        {uploading && (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", overflow: "hidden", height: 6, marginBottom: 16 }}>
            <div style={{ height: "100%", background: "var(--accent)", width: "60%", animation: "none", transition: "width 0.3s" }} />
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={uploading} style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "var(--radius)", fontSize: "1rem" }}>
          {uploading ? "Uploading…" : "Publish Video"}
        </button>
      </form>
    </div>
  );
}