// pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";

export default function Login() {
  const navigate              = useNavigate();
  const [form,    setForm]    = useState({ username: "", password: "" });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      const me = await authAPI.me();
      localStorage.setItem("user", JSON.stringify(me.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-text">
            <span className="logo-yt"><i className="bi bi-youtube" /></span> ViewTube
          </span>
        </div>

        <h2 className="auth-title">Sign in</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className={`form-input${error ? " error" : ""}`}
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="your_username"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className={`form-input${error ? " error" : ""}`}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="form-error" style={{ marginBottom: 12 }}>
              <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary form-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner spinner--sm" style={{ borderTopColor: "#fff" }} /> Signing in…</>
            ) : (
              <><i className="bi bi-box-arrow-in-right" /> Sign in</>
            )}
          </button>
        </form>

        <p className="form-footer-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
        <p className="form-footer-link" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: "var(--yt-text-secondary)" }}>
            <i className="bi bi-arrow-left" style={{ marginRight: 4 }} />
            Back to ViewTube
          </Link>
        </p>
      </div>
    </div>
  );
}