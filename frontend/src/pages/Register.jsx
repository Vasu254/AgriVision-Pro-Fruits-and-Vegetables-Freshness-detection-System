import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function PasswordStrength({ pass }) {
  const score =
    (pass.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pass) ? 1 : 0) +
    (/[0-9]/.test(pass) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pass) ? 1 : 0);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ff1744', '#ff9100', '#ffeb3b', '#00e676'];
  if (!pass) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.78rem', color: colors[score], marginTop: 4, display: 'block' }}>
        {labels[score]}
      </span>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.username.trim() || form.username.length < 3) errs.username = 'At least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [e.target.name]: '' }));
    setError(''); setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
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
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">🌿</span>
          <span className="auth-logo-text">
            Fresh<span className="auth-logo-highlight">Check</span>
          </span>
        </Link>

        <h1 className="auth-title">Create Account ✨</h1>
        <p className="auth-subtitle">Join FreshCheck to start analyzing produce with AI.</p>

        {error && <div className="auth-banner error">⚠️ {error}</div>}
        {success && <div className="auth-banner success">✅ {success}</div>}

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
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
            {fieldErrors.username && <span className="auth-error-msg">⚠ {fieldErrors.username}</span>}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <input
                className={`auth-input ${fieldErrors.email ? 'error-input' : ''}`}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="auth-error-msg">⚠ {fieldErrors.email}</span>}
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
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button type="button" className="auth-toggle-pass" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordStrength pass={form.password} />
            {fieldErrors.password && <span className="auth-error-msg">⚠ {fieldErrors.password}</span>}
          </div>

          {/* Confirm */}
          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔑</span>
              <input
                className={`auth-input ${fieldErrors.confirm ? 'error-input' : ''}`}
                type={showPass ? 'text' : 'password'}
                name="confirm"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
            {fieldErrors.confirm && <span className="auth-error-msg">⚠ {fieldErrors.confirm}</span>}
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Creating account…</> : '🌟 Create Account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
