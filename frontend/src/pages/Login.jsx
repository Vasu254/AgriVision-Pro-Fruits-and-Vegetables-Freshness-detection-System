import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [e.target.name]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true);
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-orb-1" />
      <div className="auth-orb-2" />

      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">🌿</span>
          <span className="auth-logo-text">
            Fresh<span className="auth-logo-highlight">Check</span>
          </span>
        </Link>

        <h1 className="auth-title">Welcome Back 👋</h1>
        <p className="auth-subtitle">Sign in to access AI-powered freshness detection.</p>

        {error && (
          <div className="auth-banner error">⚠️ {error}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                className={`auth-input ${fieldErrors.username ? 'error-input' : ''}`}
                type="text"
                name="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
            {fieldErrors.username && <span className="auth-error-msg">⚠ {fieldErrors.username}</span>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                className={`auth-input ${fieldErrors.password ? 'error-input' : ''}`}
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && <span className="auth-error-msg">⚠ {fieldErrors.password}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Signing in…</> : '🚀 Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one free →</Link>
        </p>
      </div>
    </div>
  );
}
