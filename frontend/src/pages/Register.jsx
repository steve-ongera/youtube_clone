// pages/Register.jsx
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
    if (!form.username.trim())      errs.username  = "Username is required.";
    if (!form.email.trim())         errs.email     = "Email is required.";
    if (form.password.length < 8)   errs.password  = "Minimum 8 characters.";
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
    { name: "username",  label: "Username",        type: "text",     placeholder: "cool_creator",    icon: "bi-person" },
    { name: "email",     label: "Email",            type: "email",    placeholder: "you@example.com", icon: "bi-envelope" },
    { name: "password",  label: "Password",         type: "password", placeholder: "Min 8 characters",icon: "bi-lock" },
    { name: "password2", label: "Confirm Password", type: "password", placeholder: "Repeat password", icon: "bi-lock-fill" },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-text">
            <span className="logo-yt"><i className="bi bi-youtube" /></span> ViewTube
          </span>
        </div>

        <h2 className="auth-title">Create account</h2>

        <form onSubmit={handleSubmit}>
          {fields.map(({ name, label, type, placeholder }) => (
            <div className="form-group" key={name}>
              <label className="form-label" htmlFor={`reg-${name}`}>{label}</label>
              <input
                id={`reg-${name}`}
                className={`form-input${errors[name] ? " error" : ""}`}
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                autoComplete={name === "password2" ? "new-password" : name}
              />
              {errors[name] && (
                <span className="form-error">
                  <i className="bi bi-exclamation-circle" style={{ marginRight: 4 }} />
                  {errors[name]}
                </span>
              )}
            </div>
          ))}

          {/* Non-field server errors */}
          {errors.non_field_errors && (
            <p className="form-error" style={{ marginBottom: 12 }}>
              <i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />
              {errors.non_field_errors}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary form-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner spinner--sm" style={{ borderTopColor: "#fff" }} /> Creating account…</>
            ) : (
              <><i className="bi bi-person-plus" /> Create Account</>
            )}
          </button>
        </form>

        <p className="form-footer-link">
          Already have an account? <Link to="/login">Sign in</Link>
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