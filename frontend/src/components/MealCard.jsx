import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MealCard({ meal, onRsvp }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState('');

  const userId = user?._id;
  const isAttending = meal.attendingStudents?.includes(userId);
  const isSkipping = meal.skippedStudents?.includes(userId);

  const mealIcons = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' };
  const mealTimes = { Breakfast: '8:00 - 9:00 AM', Lunch: '12:30 - 2:00 PM', Dinner: '8:00 - 9:00 PM' };
  const mealColors = {
    Breakfast: 'rgba(255, 179, 0, 0.1)',
    Lunch: 'rgba(0, 200, 83, 0.1)',
    Dinner: 'rgba(33, 150, 243, 0.1)'
  };

  const handleRsvp = async (status) => {
    setLoading(status);
    try {
      await onRsvp(meal._id, status);
    } finally {
      setLoading('');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="meal-card card">
      <div className="meal-card-header" style={{ background: mealColors[meal.type] }}>
        <div className="meal-type">
          <div className="meal-type-icon" style={{ background: 'rgba(255,255,255,0.7)' }}>
            {mealIcons[meal.type] || '🍽'}
          </div>
          <div>
            <h3>{meal.type}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {formatDate(meal.date)}
            </span>
          </div>
        </div>
        <span className="meal-time">{mealTimes[meal.type]}</span>
      </div>

      <div className="meal-card-body">
        <div className="meal-items">
          {meal.menuItems?.map((item, idx) => (
            <span key={idx} className="meal-item-chip">{item}</span>
          ))}
        </div>

        <div className="meal-card-actions">
          <button
            className={`btn btn-attend ${isAttending ? 'active' : ''}`}
            onClick={() => handleRsvp('Attending')}
            disabled={loading !== '' || isAttending}
          >
            {loading === 'Attending' ? '...' : '✓ Attend'}
          </button>
          <button
            className={`btn btn-skip ${isSkipping ? 'active' : ''}`}
            onClick={() => handleRsvp('Skipping')}
            disabled={loading !== '' || isSkipping}
          >
            {loading === 'Skipping' ? '...' : '✕ Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
