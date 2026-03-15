import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import { getAdminCookSheet, getLiveCrowd, getPendingRebates, getAdminPolls } from '../../services/api';

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };
const MEAL_COLORS = {
  Breakfast: { bg: 'rgba(255, 152, 0, 0.08)', border: 'rgba(255, 152, 0, 0.3)', accent: '#f57c00' },
  Lunch:     { bg: 'rgba(33, 150, 243, 0.08)', border: 'rgba(33, 150, 243, 0.3)', accent: '#1565c0' },
  Dinner:    { bg: 'rgba(103, 58, 183, 0.08)', border: 'rgba(103, 58, 183, 0.3)', accent: '#4527a0' },
};

function MealRequirementRow({ meal }) {
  const colors = MEAL_COLORS[meal.type] || MEAL_COLORS.Lunch;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', borderRadius: '10px',
      background: colors.bg, border: `1px solid ${colors.border}`,
      marginBottom: '8px'
    }}>
      <span style={{ fontSize: '1.4rem', minWidth: '32px' }}>{MEAL_ICONS[meal.type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: colors.accent }}>{meal.type}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
          {meal.name || 'Menu not set'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', color: colors.accent, lineHeight: 1 }}>{meal.headcount}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>plates</div>
      </div>
      <div style={{ textAlign: 'right', minWidth: '70px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
          <span style={{ color: '#2e7d32' }}>✓ {meal.rsvpAttending}</span>
          {' · '}
          <span style={{ color: '#c62828' }}>✕ {meal.rsvpSkipping}</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>RSVP</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    currentCrowd: 0,
    pendingRebates: 0,
    activePolls: 0,
    totalStudents: 0,
  });
  const [todayMeals, setTodayMeals] = useState([]);
  const [tomorrowMeals, setTomorrowMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [cookSheetRes, crowdRes, rebatesRes, pollsRes] = await Promise.all([
          getAdminCookSheet(),
          getLiveCrowd(),
          getPendingRebates(),
          getAdminPolls()
        ]);

        setTodayMeals(cookSheetRes.data.todayMeals || []);
        setTomorrowMeals(cookSheetRes.data.tomorrowMeals || []);

        const rebates = rebatesRes.data.rebates || [];
        const polls = pollsRes.data.polls || [];

        setStats({
          totalStudents: cookSheetRes.data.totalStudents || 0,
          currentCrowd: crowdRes.data.crowdCount || 0,
          pendingRebates: rebates.filter(r => r.status === 'pending').length,
          activePolls: polls.filter(p => p.isActive).length,
        });
      } catch (err) {
        console.error('Failed to load admin dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const noMealsToday = todayMeals.length === 0;
  const noMealsTomorrow = tomorrowMeals.length === 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of system metrics and current status</p>
      </div>

      {/* Top stat cards */}
      <div className="admin-stats-staggered">
        <div className="admin-stats-row">
          <StatCard icon="👥" iconBg="rgba(33, 150, 243, 0.08)"
            value={stats.totalStudents} label="Total Students" trend="Registered in system" trendDir="up" />
          <StatCard icon="🔥" iconBg="var(--color-warning-bg)"
            value={stats.currentCrowd} label="Current Mess Crowd" trend="Live scanner data" trendDir="up" />
        </div>
        <div className="admin-stats-row">
          <StatCard icon="📝" iconBg="var(--color-danger-bg)"
            value={stats.pendingRebates} label="Pending Rebates" trend="Requires review" trendDir="down" />
          <StatCard icon="📢" iconBg="var(--color-info-bg)"
            value={stats.activePolls} label="Active Polls" trend="Ongoing engagements" trendDir="up" />
        </div>
      </div>

      {/* Cook Sheet: Upcoming Meal Requirements */}
      <div style={{ marginTop: '28px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🍽️ Cook Sheet — Upcoming Meal Requirements
          <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', borderRadius: '20px', padding: '2px 10px' }}>
            Today &amp; Tomorrow
          </span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

          {/* Today */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              📅 Today
            </h3>
            {noMealsToday ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                No meals uploaded for today
              </p>
            ) : (
              todayMeals.map(meal => <MealRequirementRow key={meal._id} meal={meal} />)
            )}
          </div>

          {/* Tomorrow */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              📆 Tomorrow
            </h3>
            {noMealsTomorrow ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                No meals uploaded for tomorrow
              </p>
            ) : (
              tomorrowMeals.map(meal => <MealRequirementRow key={meal._id} meal={meal} />)
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
