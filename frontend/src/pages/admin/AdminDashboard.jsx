import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import { getAdminCookSheet, getLiveCrowd, getPendingRebates, getAdminPolls } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    mealsCooked: 0,
    currentCrowd: 0,
    pendingRebates: 0,
    activePolls: 0
  });
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

        const cookSheet = cookSheetRes.data.cookSheet || [];
        const todayMeal = cookSheet.length > 0 ? cookSheet[0] : null;
        const totalStudents = todayMeal ? todayMeal.headcount : 0;
        const mealsCooked = cookSheet.reduce((acc, meal) => acc + (meal.targetCookingVolume || 0), 0);

        const rebates = rebatesRes.data.rebates || [];
        const pendingCount = rebates.filter(r => r.status === 'pending').length;

        const polls = pollsRes.data.polls || [];
        const activeCount = polls.filter(p => p.isActive).length;

        setStats({
          totalStudents,
          mealsCooked,
          currentCrowd: crowdRes.data.crowdCount || 0,
          pendingRebates: pendingCount,
          activePolls: activeCount
        });
      } catch (err) {
        console.error('Failed to load admin dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of system metrics and current status</p>
      </div>

      <div className="admin-stats-staggered">
        <div className="admin-stats-row">
          <StatCard
            icon="👥"
            iconBg="rgba(33, 150, 243, 0.08)"
            value={stats.totalStudents}
            label="Total Students Today"
            trend="Registered for meals"
            trendDir="up"
          />
          <StatCard
            icon="🍽"
            iconBg="var(--color-primary-bg)"
            value={stats.mealsCooked}
            label="Meals Required (3 Days)"
            trend="Total planned portions"
            trendDir="up"
          />
        </div>
        <div className="admin-stats-row single">
          <StatCard
            icon="🔥"
            iconBg="var(--color-warning-bg)"
            value={stats.currentCrowd}
            label="Current Mess Crowd"
            trend="Live scanner data"
            trendDir="up"
          />
        </div>
        <div className="admin-stats-row">
          <StatCard
            icon="📝"
            iconBg="var(--color-danger-bg)"
            value={stats.pendingRebates}
            label="Pending Rebates"
            trend="Requires review"
            trendDir="down"
          />
          <StatCard
            icon="📢"
            iconBg="var(--color-info-bg)"
            value={stats.activePolls}
            label="Active Polls"
            trend="Ongoing engagements"
            trendDir="up"
          />
        </div>
      </div>
    </div>
  );
}
