import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";

export default function Login() {
  const navigate             = useNavigate();
  const [form,    setForm]   = useState({ username: "", password: "" });
  const [error,   setError]  = useState(null);
  const [loading, setLoading]= useState(false);

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

      // Fetch user profile
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="form-card">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>▶ ViewTube</span>
        </div>

        <h2>Sign in</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} placeholder="your_username" autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "var(--radius)", marginTop: 8, fontSize: "0.95rem" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)" }}>Create one</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 8, fontSize: "0.88rem" }}>
          <Link to="/" style={{ color: "var(--text-muted)" }}>← Back to ViewTube</Link>
        </p>
      </div>
    </div>
  );
}