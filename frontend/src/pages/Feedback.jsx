import { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function Feedback() {
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getTodayMeals()
      .then((res) => setMeals(res.data.meals || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMeal) {
      setMessage({ text: 'Please select a meal', type: 'error' });
      return;
    }
    if (!rating) {
      setMessage({ text: 'Please select a rating', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.submitFeedback(selectedMeal, rating, comments);
      setMessage({ text: 'Thank you for your feedback! 🙏', type: 'success' });
      setRating(0);
      setComments('');
      setSelectedMeal('');
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to submit feedback',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    marginBottom: '8px',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Feedback</h1>
        <p>Rate your meals and help us improve</p>
      </div>

      <div className="feedback-page-content">
        <div className="glass-card" style={{ padding: '32px' }}>
          {message.text && (
            <div style={{
              background: message.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-primary-bg)',
              color: message.type === 'error' ? 'var(--color-danger)' : 'var(--color-primary-dark)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontWeight: 500,
              fontSize: '0.9rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Select Meal</label>
              <select
                className="input-field"
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Choose a meal...</option>
                {meals.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.type} — {new Date(m.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${(hoverRating || rating) >= star ? 'active' : 'inactive'}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
                {rating > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                    {['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Comments (Optional)</label>
              <textarea
                className="input-field"
                placeholder="Share your thoughts about the meal quality, variety, taste..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                style={{ minHeight: '120px' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
