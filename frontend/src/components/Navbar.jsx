import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/');
    setShowModal(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <button className="navbar-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        <div className="navbar-center">
          <span className="navbar-motto">Save Food • Save Life ☘️</span>
        </div>

        <div className="navbar-right">

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              className="navbar-avatar"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {initials}
            </div>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{user?.name || 'Student'}</div>
                  <div className="dropdown-user-email">{user?.email || ''}</div>
                </div>
                <div className="dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                  👤 Profile
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-item danger" onClick={() => { setShowModal(true); setDropdownOpen(false); }}>
                  🚪 Sign Out
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Sign Out?</h3>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
