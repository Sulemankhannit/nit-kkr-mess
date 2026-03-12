import { useState } from 'react';
import API from '../../services/api';

export default function MenuManagement() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const initialWeek = {
    monday: { breakfast: '', lunch: '', dinner: '' },
    tuesday: { breakfast: '', lunch: '', dinner: '' },
    wednesday: { breakfast: '', lunch: '', dinner: '' },
    thursday: { breakfast: '', lunch: '', dinner: '' },
    friday: { breakfast: '', lunch: '', dinner: '' },
    saturday: { breakfast: '', lunch: '', dinner: '' },
    sunday: { breakfast: '', lunch: '', dinner: '' }
  };
  const [menuData, setMenuData] = useState(initialWeek);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (day, mealType, value) => {
    setMenuData(prev => ({
      ...prev,
      [day]: { ...prev[day], [mealType]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formattedData = {};
    for (const day in menuData) {
      formattedData[day] = {
        breakfast: menuData[day].breakfast.split(',').map(i => i.trim()).filter(i => i),
        lunch: menuData[day].lunch.split(',').map(i => i.trim()).filter(i => i),
        dinner: menuData[day].dinner.split(',').map(i => i.trim()).filter(i => i)
      };
    }

    try {
      await API.post('/menu/upload-week', { startDate, menuData: formattedData });
      alert('Weekly menu successfully generated and uploaded!');
      setMenuData(initialWeek);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload menu. Check if dates already exist.');
    } finally {
      setLoading(false);
    }
  };

  const daysList = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Menu Management</h1>
        <p>Update the daily and weekly mess menu</p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <h3 className="section-heading" style={{ textAlign: 'center', color: 'var(--color-primary)' }}>Create New Weekly Menu</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ maxWidth: '300px', margin: '0 auto var(--sp-8) auto' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Week Start Date (Monday)
            </label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-6)' }}>
            {daysList.map(day => (
              <div key={day} className="day-card">
                <h4>{day}</h4>

                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-1)' }}>Breakfast (comma separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--text-base)' }}
                    value={menuData[day].breakfast}
                    onChange={e => handleItemChange(day, 'breakfast', e.target.value)}
                    placeholder="e.g. Idli, Sambar, Chutney"
                  />
                </div>

                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-1)' }}>Lunch (comma separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--text-base)' }}
                    value={menuData[day].lunch}
                    onChange={e => handleItemChange(day, 'lunch', e.target.value)}
                    placeholder="e.g. Rice, Dal, Roti"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-1)' }}>Dinner (comma separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--text-base)' }}
                    value={menuData[day].dinner}
                    onChange={e => handleItemChange(day, 'dinner', e.target.value)}
                    placeholder="e.g. Chicken Curry, Paneer"
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--sp-10)' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: '250px' }}>
              {loading ? 'Processing...' : 'Generate 21 Meals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
