import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";

export default function Register() {
  const navigate              = useNavigate();
  const [form,    setForm]    = useState({ username: "", email: "", password: "", password2: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  }

  function validate() {
    const errs = {};
    if (!form.username.trim())  errs.username  = "Username is required.";
    if (!form.email.trim())     errs.email     = "Email is required.";
    if (form.password.length < 8) errs.password = "Minimum 8 characters.";
    if (form.password !== form.password2) errs.password2 = "Passwords do not match.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      await authAPI.register(form);
      // Auto-login
      const { data } = await authAPI.login({ username: form.username, password: form.password });
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      const me = await authAPI.me();
      localStorage.setItem("user", JSON.stringify(me.data));
      navigate("/");
    } catch (err) {
      const data = err.response?.data || {};
      const mapped = {};
      for (const key of Object.keys(data)) {
        mapped[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
      }
      setErrors(mapped);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { name: "username",  label: "Username",         type: "text",     placeholder: "cool_creator" },
    { name: "email",     label: "Email",             type: "email",    placeholder: "you@example.com" },
    { name: "password",  label: "Password",          type: "password", placeholder: "Min 8 characters" },
    { name: "password2", label: "Confirm Password",  type: "password", placeholder: "Repeat password" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="form-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>▶ ViewTube</span>
        </div>

        <h2>Create account</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          {fields.map(({ name, label, type, placeholder }) => (
            <div className="form-group" key={name}>
              <label>{label}</label>
              <input
                name={name} type={type} value={form[name]}
                onChange={handleChange} placeholder={placeholder}
                style={errors[name] ? { borderColor: "var(--accent)" } : {}}
              />
              {errors[name] && <p className="form-error">{errors[name]}</p>}
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: "var(--radius)", marginTop: 8, fontSize: "0.95rem" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 8 }}>
          <Link to="/" style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>← Back to ViewTube</Link>
        </p>
      </div>
    </div>
  );
}