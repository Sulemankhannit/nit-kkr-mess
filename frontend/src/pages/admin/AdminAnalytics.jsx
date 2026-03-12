import { useState, useEffect } from 'react';
import { getAdminAnalytics } from '../../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getAdminAnalytics();
      setData(res.data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data) return <div className="fade-in"><div className="card empty-state">Failed to load analytics data</div></div>;

  const dailyLabels = (data.dailyRatingsTrend || []).map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }));

  const ratingChartData = {
    labels: dailyLabels,
    datasets: [{
      label: 'Average Rating (Out of 5)',
      data: (data.dailyRatingsTrend || []).map(d => d.avgRating),
      borderColor: '#ff9800',
      backgroundColor: 'rgba(255, 152, 0, 0.2)',
      tension: 0.3,
      fill: true
    }]
  };

  const wasteLabels = (data.foodSavedTrend || []).map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }));
  const wasteChartData = {
    labels: wasteLabels,
    datasets: [{
      label: 'Food Saved (kg)',
      data: (data.foodSavedTrend || []).map(d => d.savedKg),
      backgroundColor: '#2196f3',
      borderRadius: 4
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
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, border: { display: false }, beginAtZero: true }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>System Analytics</h1>
        <p>View attendance trends, meal data, and engagement</p>
      </div>

      {data.aiAlerts && data.aiAlerts.length > 0 && (
        <div className="card admin-alert">
          <h4><span>🤖</span> AI Predictor Alerts</h4>
          <ul>
            {data.aiAlerts.map((alert, i) => (
              <li key={i}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts */}
      <div className="admin-charts">
        <div className="chart-card card">
          <h3>📈 Average Meal Ratings (7 Days)</h3>
          <div style={{ height: '280px' }}>
            <Line data={ratingChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 5 } } }} />
          </div>
        </div>

        <div className="chart-card card">
          <h3>📊 Food Waste Reduction (7 Days)</h3>
          <div style={{ height: '280px' }}>
            <Bar data={wasteChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top / Bottom meals */}
      <div className="admin-charts">
        <div className="card" style={{ padding: 'var(--sp-6)' }}>
          <h3 className="section-heading">🏆 Top 3 Loved Meals</h3>
          {data.top3Meals && data.top3Meals.map((meal, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <div>
                <strong style={{ display: 'block' }}>{meal.type}</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{meal.name}</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{meal.avgRating} ⭐</div>
            </div>
          ))}
          {(!data.top3Meals || data.top3Meals.length === 0) && <p style={{ color: 'var(--color-text-secondary)' }}>No sufficient data.</p>}
        </div>

        <div className="card" style={{ padding: 'var(--sp-6)' }}>
          <h3 className="section-heading">⚠️ Bottom 3 (Grievances)</h3>
          {data.bottom3Meals && data.bottom3Meals.map((meal, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-3) 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <div>
                <strong style={{ display: 'block' }}>{meal.type}</strong>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{meal.name}</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{meal.avgRating} ⭐</div>
            </div>
          ))}
          {(!data.bottom3Meals || data.bottom3Meals.length === 0) && <p style={{ color: 'var(--color-text-secondary)' }}>No sufficient data.</p>}
        </div>
      </div>
    </div>
  );
}
