import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, ledgerRes] = await Promise.allSettled([
          api.getStudentAnalytics(),
          api.getLedger()
        ]);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data.analytics);
        if (ledgerRes.status === 'fulfilled') setLedger(ledgerRes.value.data.ledger);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const eco = analytics?.ecoFootprint || {};
  const heatmap = analytics?.heatmap || [];
  const attendedDays = heatmap.filter(d => d.status === 'attended').length;
  const skippedDays = heatmap.filter(d => d.status === 'skipped').length;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your account information and statistics</p>
      </div>

      {/* Profile Header */}
      <div className="profile-header-card glass-card">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-info">
          <h2>{user?.name || 'Student'}</h2>
          <div className="profile-email">{user?.email || ''}</div>
          <span className="badge badge-success profile-role" style={{ marginTop: '8px' }}>
            {user?.role || 'student'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats-grid" style={{ marginTop: 'var(--sp-6)' }}>
        <StatCard
          icon="✅"
          iconBg="var(--color-primary-bg)"
          value={attendedDays}
          label="Meals Attended (30d)"
        />
        <StatCard
          icon="⏭"
          iconBg="var(--color-warning-bg)"
          value={eco.totalSkips || skippedDays}
          label="Meals Skipped"
        />
        <StatCard
          icon="🌍"
          iconBg="rgba(33, 150, 243, 0.08)"
          value={`${eco.savedKg || 0} kg`}
          label="Food Saved"
        />
      </div>

      {/* Account Details */}
      <div className="card" style={{ padding: 'var(--sp-7)', marginTop: 'var(--sp-6)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-5)' }}>Account Details</h3>
        <div style={{ display: 'grid', gap: '0' }}>
          {[
            ['Full Name', user?.name],
            ['Email', user?.email],
            ['Role', user?.role && user.role.charAt(0).toUpperCase() + user.role.slice(1)],
            ['Wallet Balance', `₹${ledger?.currentBalance ?? 'N/A'}`],
            ['Joined', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'],
          ].map(([label, value], i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'var(--sp-4) 0',
              borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none'
            }}>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
