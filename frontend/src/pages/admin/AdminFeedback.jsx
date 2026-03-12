import { useState, useEffect } from 'react';
import { getAllFeedback } from '../../services/api';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [mealFilter, setMealFilter] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await getAllFeedback();
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = feedbacks.filter(f => {
    let matchesDate = true;
    let matchesMeal = true;

    if (dateFilter && f.meal && f.meal.date) {
      matchesDate = new Date(f.meal.date).toISOString().split('T')[0] === dateFilter;
    }
    if (mealFilter && f.meal && f.meal.type) {
      matchesMeal = f.meal.type === mealFilter;
    }
    return matchesDate && matchesMeal;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Feedback Monitoring</h1>
        <p>Review student ratings and comments</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        <h3 className="section-heading">Filter Feedback</h3>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>By Date</label>
            <input
              type="date"
              className="input-field"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>By Meal Type</label>
            <select
              className="input-field"
              value={mealFilter}
              onChange={e => setMealFilter(e.target.value)}
            >
              <option value="">All Meals</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => { setDateFilter(''); setMealFilter(''); }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="card-stack">
        {filteredFeedback.map(f => (
          <div key={f._id} className="card" style={{ padding: 'var(--sp-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
              <div>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{f.rating} ⭐</span>
                  {f.meal && <span style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>| {f.meal.type}</span>}
                </h4>
                {f.meal && (
                  <p style={{ margin: 'var(--sp-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {new Date(f.meal.date).toLocaleDateString()} — {f.meal.menuItems?.join(', ')}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>{f.user?.name || 'Anonymous'}</strong><br />
                {f.user?.email || ''}
              </div>
            </div>

            {f.comments
              ? <div className="feedback-quote">"{f.comments}"</div>
              : <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>(No written comment)</div>
            }
          </div>
        ))}

        {filteredFeedback.length === 0 && (
          <div className="card empty-state">
            No feedback entries found matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
}
