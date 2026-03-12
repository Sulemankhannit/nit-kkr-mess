import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import StatCard from '../components/StatCard';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

export default function Dashboard() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [crowd, setCrowd] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ledgerRes, crowdRes, analyticsRes, mealsRes] = await Promise.allSettled([
          api.getLedger(),
          api.getLiveCrowd(),
          api.getStudentAnalytics(),
          api.getTodayMeals()
        ]);

        if (ledgerRes.status === 'fulfilled') setLedger(ledgerRes.value.data.ledger);
        if (crowdRes.status === 'fulfilled') {
          const c = crowdRes.value.data.crowdCount;
          setCrowd(Array.isArray(c) ? c.length : c);
        }
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data.analytics);
        if (mealsRes.status === 'fulfilled') setMeals(mealsRes.value.data.meals);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const savedKg = analytics?.ecoFootprint?.savedKg || '0';
  const totalSkips = analytics?.ecoFootprint?.totalSkips || 0;

  // Chart: weekly attendance
  const attendanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Attended',
        data: analytics?.heatmap
          ? analytics.heatmap.slice(-7).map(d => d.status === 'attended' ? 1 : 0)
          : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(0, 200, 83, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Skipped',
        data: analytics?.heatmap
          ? analytics.heatmap.slice(-7).map(d => d.status === 'skipped' ? 1 : 0)
          : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 82, 82, 0.5)',
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  const doughnutData = {
    labels: ['Attended', 'Skipped'],
    datasets: [{
      data: [
        analytics?.heatmap?.filter(d => d.status === 'attended').length || 1,
        analytics?.heatmap?.filter(d => d.status === 'skipped').length || 0
      ],
      backgroundColor: ['#00C853', '#FF5252'],
      borderWidth: 0,
      cutout: '75%'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: '#f0f0f0' }, border: { display: false }, beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const crowdLevel = crowd < 20 ? 'Low' : crowd < 50 ? 'Medium' : 'High';

  return (
    <div className="fade-in">
      <div className="page-header">
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Welcome back, {user?.name || 'Student'}
        </p>
        <h1>Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats">
        <StatCard
          icon="🍽"
          iconBg="var(--color-primary-bg)"
          value={meals.length}
          label="Today's Meals"
          trend="Available now"
          trendDir="up"
        />
        <StatCard
          icon="👥"
          iconBg="rgba(33, 150, 243, 0.08)"
          value={crowd}
          label="Live Crowd"
          trend={crowdLevel}
          trendDir={crowd < 50 ? 'up' : 'down'}
        />
        <StatCard
          icon="⏭"
          iconBg="var(--color-warning-bg)"
          value={totalSkips}
          label="Meals Skipped"
        />
        <StatCard
          icon="🎁"
          iconBg="rgba(156, 39, 176, 0.08)"
          value={ledger?.rewardsAvailableToClaim || 0}
          label="Rewards Available"
        />
        <StatCard
          icon="💰"
          iconBg="var(--color-primary-bg)"
          value={`₹${ledger?.currentBalance ?? 4000}`}
          label="Wallet Balance"
        />
      </div>

      {/* Food Impact Tracker */}
      <div className="impact-tracker card" style={{ borderColor: 'transparent' }}>
        <div className="impact-content">
          <h3>🌍 Food Impact Tracker</h3>
          <div className="impact-value">{savedKg} kg</div>
          <p>{analytics?.ecoFootprint?.impactMessage || 'Start skipping meals to track your food savings!'}</p>
          <div style={{ display: 'flex', gap: '32px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{totalSkips}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total Skips</div>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{savedKg}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Kg Saved</div>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {((totalSkips) * 0.4 * 2.5).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>CO₂ Reduced (kg)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <div className="chart-card card">
          <h3>📊 Weekly Attendance</h3>
          <div style={{ height: '280px' }}>
            <Bar data={attendanceData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card card">
          <h3>🥧 Your Meal Split</h3>
          <div style={{ height: '280px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
