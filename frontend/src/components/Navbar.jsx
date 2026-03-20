import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const PROTECTED_LINKS = [
  { to: "/detect",    icon: "🔍", label: "Detect"   },
  { to: "/batch",     icon: "📦", label: "Batch"    },
  { to: "/camera",    icon: "🏭", label: "Camera"   },
  { to: "/video",     icon: "🎥", label: "Video"    },
  { to: "/dashboard", icon: "📊", label: "Database" },
  { to: "/about",     icon: "ℹ️", label: "About"    },
  { to: "/contact",   icon: "✉️", label: "Contact"  },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          <div className="logo-icon">🌿</div>
          <span className="logo-text">
            Fresh<span className="logo-highlight">Check</span>
          </span>
        </NavLink>

        {/* Desktop Nav Links (collapsible on mobile) */}
        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            <span className="nav-icon">🏠</span> Home
          </NavLink>

          {user && PROTECTED_LINKS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <span className="nav-icon">{icon}</span> {label}
            </NavLink>
          ))}

          {/* Mobile-only auth links */}
          {!user && (
            <>
              <NavLink to="/login"    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-icon">🔐</span> Login</NavLink>
              <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-icon">✨</span> Register</NavLink>
            </>
          )}
          {user && (
            <button className="nav-link nav-logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span> Logout
            </button>
          )}
        </div>

        {/* Desktop right side */}
        {user ? (
          <div className="navbar-user-area">
            <div className="user-chip">
              <span className="user-avatar">{(user.username?.[0] ?? '?').toUpperCase()}</span>
              <span className="user-name">{user.username}</span>
            </div>
            <button className="navbar-logout-btn" onClick={handleLogout}>🚪 Logout</button>
          </div>
        ) : (
          <div className="navbar-auth-btns">
            <NavLink to="/login"    className="navbar-login-btn">Sign In</NavLink>
            <NavLink to="/register" className="navbar-cta">Register →</NavLink>
          </div>
        )}

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
