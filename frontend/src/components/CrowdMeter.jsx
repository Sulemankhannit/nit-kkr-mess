export default function CrowdMeter({ count }) {
  const level = count < 20 ? 'low' : count < 50 ? 'medium' : 'high';
  const labels = { low: 'Low Crowd', medium: 'Moderate Crowd', high: 'High Crowd' };
  const descriptions = {
    low: 'Great time to visit! The mess is fairly empty.',
    medium: 'Moderate crowd. Expect a short wait.',
    high: 'Very busy right now. You might want to wait.'
  };

  return (
    <div className="crowd-meter-card glass-card">
      <div className={`crowd-gauge ${level}`}>
        <span className="crowd-count">{count}</span>
        <span className="crowd-unit">students</span>
      </div>

      <div className={`crowd-status ${level}`}>{labels[level]}</div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
        {descriptions[level]}
      </p>

      <div className="crowd-legend">
        <div className="crowd-legend-item">
          <div className="crowd-legend-dot" style={{ background: 'var(--color-primary)' }} />
          <span>Low (&lt;20)</span>
        </div>
        <div className="crowd-legend-item">
          <div className="crowd-legend-dot" style={{ background: 'var(--color-warning)' }} />
          <span>Medium (20-50)</span>
        </div>
        <div className="crowd-legend-item">
          <div className="crowd-legend-dot" style={{ background: 'var(--color-danger)' }} />
          <span>High (&gt;50)</span>
        </div>
      </div>
    </div>
  );
}
