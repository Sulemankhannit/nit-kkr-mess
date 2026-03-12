export default function StatCard({ icon, iconBg, value, label, trend, trendDir }) {
  return (
    <div className="stat-card glass-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: iconBg || 'var(--color-primary-bg)' }}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className="stat-footer">
          <span className={trendDir === 'up' ? 'trend-up' : 'trend-down'}>
            {trendDir === 'up' ? '↑' : '↓'} {trend}
          </span>
        </div>
      )}
    </div>
  );
}
