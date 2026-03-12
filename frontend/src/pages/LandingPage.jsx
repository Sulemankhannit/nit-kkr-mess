import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="logo">
          <div className="logo-icon">🍽</div>
          <span>NIT KKR Mess</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#mission">Mission</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <button
            className="navbar-icon-btn theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ marginRight: '8px' }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">🌱 Reducing Food Wastage at NIT KKR</div>
        <h1>Save Food. <span>Save Resources.</span></h1>
        <p>
          Our smart mess management system helps reduce food wastage by allowing 
          students to plan meals, track consumption, and earn rewards.
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary btn-lg">Get Started →</Link>
          <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <h3>500+</h3>
            <p>Active Students</p>
          </div>
          <div className="stat">
            <h3>1,200kg</h3>
            <p>Food Saved</p>
          </div>
          <div className="stat">
            <h3>95%</h3>
            <p>RSVP Accuracy</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Smart features designed for a zero-waste campus</p>
        </div>
        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon">📋</div>
            <h3>Smart Meal RSVP</h3>
            <p>Mark meals as Attend or Skip. Help the kitchen prepare the right amount of food.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">📊</div>
            <h3>Live Crowd Meter</h3>
            <p>See how crowded the mess is in real-time before you head out.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">🎁</div>
            <h3>Rewards System</h3>
            <p>Earn rewards when you skip meals. Redeem them for free meals later.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">🌍</div>
            <h3>Food Impact Tracker</h3>
            <p>Track exactly how much food you've helped save and your eco-footprint.</p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section" id="mission">
        <div className="mission-card">
          <h2>Our Mission 🎯</h2>
          <p>
            Every day, college messes across India waste thousands of kilograms of food. 
            We're on a mission to change that at NIT Kurukshetra. By giving students the 
            power to RSVP meals, we help the kitchen prepare just the right amount — 
            reducing wastage, saving resources, and building a more sustainable campus.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" id="about">
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <div className="footer-copy">
          © 2026 NIT KKR Mess Management. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
