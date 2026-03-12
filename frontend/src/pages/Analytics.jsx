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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import * as api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStudentAnalytics()
      .then((res) => setAnalytics(res.data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const heatmap = analytics?.heatmap || [];
  const eco = analytics?.ecoFootprint || {};

  // 7-day attendance trend
  const last7 = heatmap.slice(-7);
  const trendData = {
    labels: last7.map(h => {
      const d = new Date(h.date);
      return d.toLocaleDateString('en-IN', { weekday: 'short' });
    }),
    datasets: [{
      label: 'Attendance',
      data: last7.map(h => h.status === 'attended' ? 1 : 0),
      borderColor: '#00C853',
      backgroundColor: 'rgba(0, 200, 83, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointBackgroundColor: '#00C853',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  };

  // Weekly meal participation breakdown
  const attendedCount = heatmap.filter(d => d.status === 'attended').length;
  const skippedCount = heatmap.filter(d => d.status === 'skipped').length;
  const unknownCount = heatmap.filter(d => d.status === 'unknown').length;

  const participationData = {
    labels: ['Attended', 'Skipped', 'No Data'],
    datasets: [{
      label: 'Days',
      data: [attendedCount, skippedCount, unknownCount],
      backgroundColor: [
        'rgba(0, 200, 83, 0.75)',
        'rgba(255, 82, 82, 0.6)',
        'rgba(200, 200, 200, 0.5)',
      ],
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  // Monthly skipping trend — group heatmap by week
  const weeks = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    const weekSlice = heatmap.slice(i, i + 7);
    const skips = weekSlice.filter(d => d.status === 'skipped').length;
    weeks.push(skips);
  }

  const skippingTrendData = {
    labels: weeks.map((_, i) => `Week ${i + 1}`),
    datasets: [{
      label: 'Meals Skipped',
      data: weeks,
      borderColor: '#FF5252',
      backgroundColor: 'rgba(255, 82, 82, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointBackgroundColor: '#FF5252',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        grid: { color: '#f0f0f0' }, border: { display: false },
        min: 0, ticks: { stepSize: 1 }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: '#f0f0f0' }, border: { display: false }, beginAtZero: true, ticks: { stepSize: 5 } }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Your personal meal analytics and sustainability impact</p>
      </div>

      {/* Eco Footprint Card */}
      <div className="impact-tracker card" style={{ borderColor: 'transparent', marginBottom: '28px' }}>
        <div className="impact-content">
          <h3>🌍 Your Eco-Footprint</h3>
          <div className="impact-value">{eco.savedKg || 0} kg saved</div>
          <p>{eco.impactMessage || 'Start skipping meals to build your eco-footprint!'}</p>
          <div style={{ display: 'flex', gap: '32px', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{eco.totalSkips || 0}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total Skips</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{eco.savedKg || 0}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Kg Food Saved</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {((eco.totalSkips || 0) * 0.4 * 2.5).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>CO₂ Reduced (kg)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap + Trend side by side */}
      <div className="analytics-grid">
        <div className="heatmap-card card">
          <h3>📅 30-Day Attendance Heatmap</h3>
          <div className="heatmap-grid">
            {heatmap.map((day, idx) => (
              <div key={idx} className={`heatmap-cell ${day.status}`}>
                <span className="heatmap-tooltip">{day.date}: {day.status}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
            <div className="crowd-legend-item">
              <div className="crowd-legend-dot" style={{ background: 'var(--color-primary)' }} />
              <span style={{ fontSize: '0.75rem' }}>Attended</span>
            </div>
            <div className="crowd-legend-item">
              <div className="crowd-legend-dot" style={{ background: 'var(--color-danger)', opacity: 0.7 }} />
              <span style={{ fontSize: '0.75rem' }}>Skipped</span>
            </div>
            <div className="crowd-legend-item">
              <div className="crowd-legend-dot" style={{ background: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.75rem' }}>No data</span>
            </div>
          </div>
        </div>

        <div className="chart-card card">
          <h3>📈 7-Day Attendance Trend</h3>
          <div style={{ height: '250px' }}>
            <Line data={trendData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Monthly charts */}
      <div className="analytics-grid" style={{ marginTop: '4px' }}>
        <div className="chart-card card">
          <h3>📊 Monthly Meal Participation</h3>
          <div style={{ height: '250px' }}>
            <Bar data={participationData} options={barOptions} />
          </div>
        </div>
        <div className="chart-card card">
          <h3>📉 Weekly Skipping Trend</h3>
          <div style={{ height: '250px' }}>
            <Line data={skippingTrendData} options={lineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
