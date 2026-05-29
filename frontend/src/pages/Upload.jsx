// pages/Upload.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { videoAPI } from "../utils/api";

const VISIBILITY_OPTIONS = [
  { value: "public",   label: "Public",   icon: "bi-globe" },
  { value: "unlisted", label: "Unlisted", icon: "bi-link-45deg" },
  { value: "private",  label: "Private",  icon: "bi-lock" },
];

export default function Upload() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const thumbRef = useRef(null);

  const [form, setForm] = useState({
    title: "", description: "", visibility: "public", tag_names: "",
  });
  const [videoFile,    setVideoFile]    = useState(null);
  const [thumbFile,    setThumbFile]    = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState(null);
  const [dragOver,     setDragOver]     = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleThumb(e) {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) setVideoFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!videoFile)       return setError("Please select a video file.");
    if (!form.title.trim()) return setError("Title is required.");

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("title",       form.title);
    fd.append("description", form.description);
    fd.append("visibility",  form.visibility);
    fd.append("video_file",  videoFile);
    if (thumbFile) fd.append("thumbnail", thumbFile);
    form.tag_names
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => fd.append("tag_names", t));

    try {
      const { data } = await videoAPI.upload(fd);
      navigate(`/watch/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.detail
        || JSON.stringify(err.response?.data)
        || "Upload failed.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-page">
      <h2 className="upload-page-title">
        <i className="bi bi-cloud-upload" style={{ marginRight: 10 }} />
        Upload Video
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div
          className={`upload-drop-zone${videoFile ? " has-file" : ""}${dragOver ? " dragover" : ""}`}
          onClick={() => videoRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => setVideoFile(e.target.files[0])}
          />

          <div className="upload-drop-icon">
            <i className={`bi ${videoFile ? "bi-check-circle-fill" : "bi-camera-video"}`}
               style={{ color: videoFile ? "#2ba640" : "var(--yt-text-tertiary)" }}
            />
          </div>

          {videoFile ? (
            <p className="upload-file-name">
              <i className="bi bi-file-earmark-play" style={{ marginRight: 6 }} />
              {videoFile.name}
            </p>
          ) : (
            <>
              <p className="upload-drop-label">Click or drag a video here</p>
              <p className="upload-drop-sub">MP4, MOV, AVI, MKV — up to 2 GB</p>
            </>
          )}
        </div>

        {/* Thumbnail */}
        <div className="form-group">
          <label className="form-label">Thumbnail <span style={{ color: "var(--yt-text-tertiary)", fontWeight: 400 }}>(optional)</span></label>
          <div className="thumb-preview-row">
            {thumbPreview && (
              <img src={thumbPreview} alt="Thumbnail preview" className="thumb-preview-img" />
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => thumbRef.current.click()}
            >
              <i className={`bi ${thumbPreview ? "bi-arrow-repeat" : "bi-image"}`} />
              {thumbPreview ? "Change image" : "Choose image"}
            </button>
            <input ref={thumbRef} type="file" accept="image/*" hidden onChange={handleThumb} />
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="upload-title">
            Title <span style={{ color: "var(--yt-red)" }}>*</span>
          </label>
          <input
            id="upload-title"
            className="form-input"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter a descriptive title"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="upload-desc">Description</label>
          <textarea
            id="upload-desc"
            className="form-textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Tell viewers about your video…"
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label" htmlFor="upload-tags">
            Tags{" "}
            <span style={{ color: "var(--yt-text-tertiary)", fontWeight: 400, fontSize: "0.8rem" }}>
              (comma-separated)
            </span>
          </label>
          <input
            id="upload-tags"
            className="form-input"
            name="tag_names"
            value={form.tag_names}
            onChange={handleChange}
            placeholder="e.g. tutorial, react, coding"
          />
        </div>

        {/* Visibility */}
        <div className="form-group">
          <label className="form-label" htmlFor="upload-visibility">Visibility</label>
          <select
            id="upload-visibility"
            className="form-select"
            name="visibility"
            value={form.visibility}
            onChange={handleChange}
          >
            {VISIBILITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="form-error" style={{ marginBottom: 16 }}>
            <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />
            {error}
          </p>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div style={{
            background: "var(--yt-surface)", borderRadius: 4,
            overflow: "hidden", height: 4, marginBottom: 16,
          }}>
            <div style={{
              height: "100%", background: "var(--yt-red)",
              width: "60%", transition: "width 0.3s",
            }} />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary form-submit-btn"
          disabled={uploading}
        >
          {uploading ? (
            <><div className="spinner spinner--sm" style={{ borderTopColor: "#fff" }} /> Uploading…</>
          ) : (
            <><i className="bi bi-cloud-upload" /> Publish Video</>
          )}
        </button>
      </form>
    </div>
  );
}