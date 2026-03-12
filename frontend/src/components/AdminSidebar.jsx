import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Admin Dashboard' },
  { path: '/admin/scanner', icon: '📷', label: 'QR Scanner' },
  { path: '/admin/students', icon: '🔍', label: 'Student Search' },
  { path: '/admin/menu', icon: '🍽', label: 'Menu Management' },
  { path: '/admin/polls', icon: '📢', label: 'Poll Management' },
  { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { path: '/admin/feedback', icon: '⭐', label: 'Feedback Monitoring' },
  { path: '/admin/billing', icon: '💳', label: 'Billing Overview' },
];

export default function AdminSidebar({ collapsed, mobileOpen, isDark, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

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
        {adminItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
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
