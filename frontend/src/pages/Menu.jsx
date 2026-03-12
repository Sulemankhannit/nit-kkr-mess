import { useState, useEffect } from 'react';
import MealCard from '../components/MealCard';
import * as api from '../services/api';

export default function Menu() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const res = await api.getTodayMeals();
      setMeals(res.data.meals || []);
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (mealId, status) => {
    try {
      const res = await api.toggleRsvp(mealId, status);
      setMessage({ text: res.data.message, type: 'success' });
      fetchMeals();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'RSVP failed. Please try again.',
        type: 'error'
      });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  // Sort meals in Breakfast → Lunch → Dinner order
  const mealOrder = { breakfast: 0, lunch: 1, dinner: 2 };
  const sortMeals = (meals) =>
    [...meals].sort((a, b) =>
      (mealOrder[a.type?.toLowerCase()] ?? 9) - (mealOrder[b.type?.toLowerCase()] ?? 9)
    );

  // Separate today's and tomorrow's meals
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMeals = sortMeals(meals.filter(m => {
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }));
  const tomorrowMeals = sortMeals(meals.filter(m => {
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === tomorrow.getTime();
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Today's Menu</h1>
        <p>View meals and mark your RSVP status</p>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          background: message.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-primary-bg)',
          color: message.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary-dark)',
          marginBottom: '20px',
          fontWeight: 500,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          {message.text}
        </div>
      )}

      {meals.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽</p>
          <h3 style={{ marginBottom: '8px' }}>No Meals Available</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            The menu for today hasn't been uploaded yet. Check back later!
          </p>
        </div>
      ) : (
        <>
          {todayMeals.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>📅 Today</h2>
              <div className="meal-cards-grid" style={{ marginBottom: '32px' }}>
                {todayMeals.map((meal) => (
                  <MealCard key={meal._id} meal={meal} onRsvp={handleRsvp} />
                ))}
              </div>
            </>
          )}

          {tomorrowMeals.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>📆 Tomorrow</h2>
              <div className="meal-cards-grid">
                {tomorrowMeals.map((meal) => (
                  <MealCard key={meal._id} meal={meal} onRsvp={handleRsvp} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
