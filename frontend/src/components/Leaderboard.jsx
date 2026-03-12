export default function Leaderboard({ items = [] }) {
  const getRankClass = (idx) => {
    if (idx === 0) return 'gold';
    if (idx === 1) return 'silver';
    if (idx === 2) return 'bronze';
    return '';
  };

  return (
    <div className="leaderboard-card card">
      <h3>🏆 Top Food Savers This Month</h3>
      {items.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', padding: '20px 0' }}>
          No data available yet. Start skipping meals to appear here!
        </p>
      ) : (
        items.map((item, idx) => (
          <div className="leaderboard-item" key={idx}>
            <div className={`leaderboard-rank ${getRankClass(idx)}`}>
              {idx + 1}
            </div>
            <div className="leaderboard-avatar">
              {item.name ? item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
            </div>
            <div className="leaderboard-info">
              <div className="name">{item.name}</div>
              <div className="stat">{item.skippedMeals} meals skipped</div>
            </div>
            <div className="leaderboard-value">{item.savedKg} kg</div>
          </div>
        ))
      )}
    </div>
  );
}
