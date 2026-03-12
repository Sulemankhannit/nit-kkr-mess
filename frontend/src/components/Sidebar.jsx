import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/menu', icon: '🍽', label: "Today's Menu" },
  { path: '/my-qr', icon: '📱', label: 'My QR' },
  { path: '/crowd', icon: '👥', label: 'Live Crowd' },
  { path: '/billing', icon: '💳', label: 'Billing' },
  { path: '/rebates', icon: '📝', label: 'Rebates' },
  { path: '/polls', icon: '📢', label: 'Polls' },
  { path: '/feedback', icon: '⭐', label: 'Feedback' },
  { path: '/analytics', icon: '📈', label: 'Analytics' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const adminItems = [
  { path: '/scanner', icon: '📷', label: 'QR Scanner' },
  { isExternal: true, path: 'http://localhost:5001/dashboard.html', icon: '⚙️', label: 'Admin Panel' }, // Direct link to backend admin tools
];

export default function Sidebar({ collapsed, mobileOpen, isDark, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>

      {/* ── Top Zone: Logo & App Name ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">🍽</div>
        <span className="sidebar-logo-text">NIT KKR MESS</span>
      </div>

      {/* ── Middle Zone: Navigation ── */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="nav-divider" />
            {adminItems.map((item) => {
              if (item.isExternal) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-item"
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* ── Bottom Zone: Theme Toggle & Sign Out ── */}
      <div className="sidebar-footer">
        <button className="nav-item" onClick={onToggleTheme} aria-label="Toggle dark mode">
          <span className="nav-icon">{isDark ? '☀️' : '🌙'}</span>
          <span className="nav-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="nav-item text-danger" onClick={handleSignOut} aria-label="Sign Out">
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
