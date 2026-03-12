import { useState, useEffect } from 'react';
import CrowdMeter from '../components/CrowdMeter';
import * as api from '../services/api';

export default function Crowd() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchCrowd = async () => {
    try {
      const res = await api.getLiveCrowd();
      const c = res.data.crowdCount;
      setCount(Array.isArray(c) ? c.length : c || 0);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Crowd fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrowd();
    const interval = setInterval(fetchCrowd, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const level = count < 20 ? 'low' : count < 50 ? 'medium' : 'high';
  const percentage = Math.min((count / 100) * 100, 100);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Live Crowd</h1>
        <p>Real-time crowd status in the mess hall</p>
      </div>
      <div className="crowd-page-content">
        <CrowdMeter count={count} />

        {/* Progress bar visual */}
        <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Crowd Level</span>
            <span style={{
              fontWeight: 700, fontSize: '0.9rem',
              color: level === 'low' ? 'var(--color-primary)' : level === 'medium' ? 'var(--color-warning)' : 'var(--color-danger)'
            }}>
              {count} / 100 capacity
            </span>
          </div>
          <div style={{
            width: '100%', height: '12px', background: 'var(--color-border)',
            borderRadius: '6px', overflow: 'hidden'
          }}>
            <div style={{
              width: `${percentage}%`, height: '100%', borderRadius: '6px',
              background: level === 'low' ? 'var(--color-primary)' : level === 'medium' ? 'var(--color-warning)' : 'var(--color-danger)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Tips card */}
        <div className="glass-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>💡 Tips</h3>
          <ul style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>• <strong style={{ color: 'var(--color-primary)' }}>Low crowd</strong> — Best time to eat! Short queues</li>
            <li>• <strong style={{ color: 'var(--color-warning)' }}>Medium crowd</strong> — Moderate wait expected</li>
            <li>• <strong style={{ color: 'var(--color-danger)' }}>High crowd</strong> — Consider waiting 10-15 minutes</li>
          </ul>
        </div>

        <div className="card" style={{ padding: '16px', textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            🔄 Auto-refreshes every 30 seconds • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
