import { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function Rebates() {
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Rebate form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRebates();
  }, []);

  const fetchRebates = async () => {
    try {
      const res = await api.getMyRebates();
      setRebates(res.data.rebates || []);
    } catch (err) {
      console.error('Rebates fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRebate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.applyRebate({ startDate, endDate, phone, reason });
      setMessage(res.data.message);
      setStartDate(''); setEndDate(''); setPhone(''); setReason('');
      fetchRebates();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply rebate');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const statusColor = (s) => s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning';

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Rebates</h1>
        <p>Apply for meal rebates and track your requests</p>
      </div>

      {message && (
        <div className="alert-success">{message}</div>
      )}

      {/* Rebate Application Form */}
      <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-4)', fontSize: 'var(--text-md)' }}>📝 Apply for Rebate</h3>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleRebate}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label">Phone Number</label>
            <input type="tel" className="input-field" placeholder="Your phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label">Reason</label>
            <textarea className="input-field" placeholder="Reason for rebate..." value={reason} onChange={e => setReason(e.target.value)} required style={{ minHeight: '80px', resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 'var(--sp-5)' }}>
            {submitting ? 'Submitting...' : 'Submit Rebate Application'}
          </button>
        </form>
      </div>

      {/* Rebate History */}
      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-4)', fontSize: 'var(--text-md)' }}>📜 My Rebates</h3>

        {rebates.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>No rebate requests yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rebates.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.startDate).toLocaleDateString('en-IN')}</td>
                    <td>{new Date(r.endDate).toLocaleDateString('en-IN')}</td>
                    <td>{r.reason}</td>
                    <td>
                      <span className={`badge badge-${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
