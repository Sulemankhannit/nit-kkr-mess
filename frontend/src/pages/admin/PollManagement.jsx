import { useState, useEffect } from 'react';
import { getAdminPolls, createPoll } from '../../services/api';
import API from '../../services/api';

export default function PollManagement() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [durationMins, setDurationMins] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await getAdminPolls();
      setPolls(res.data.polls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setError('');
    const options = optionsStr.split(',').map(o => o.trim()).filter(o => o);

    if (options.length < 2) {
      setError('Please provide at least 2 comma-separated options.');
      return;
    }

    setSubmitting(true);
    try {
      await createPoll({ question, options, durationMins });
      setQuestion('');
      setOptionsStr('');
      setDurationMins(60);
      fetchPolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pollId) => {
    if (window.confirm('Delete this poll permanently?')) {
      try {
        await API.delete(`/engagement/poll/${pollId}`);
        fetchPolls();
      } catch (err) {
        alert('Failed to delete poll');
      }
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Poll Management</h1>
        <p>Create and monitor student polls</p>
      </div>

      {/* Create Poll Form */}
      <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-8)' }}>
        <h3 className="section-heading">Create New Poll</h3>
        <form onSubmit={handleCreatePoll}>
          {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--sp-3)', fontSize: 'var(--text-base)' }}>{error}</div>}
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Poll Question</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Which dessert for Sunday?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Options (Comma separated)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ice Cream, Gulab Jamun"
              value={optionsStr}
              onChange={e => setOptionsStr(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration (Minutes)</label>
            <input
              type="number"
              className="input-field"
              value={durationMins}
              onChange={e => setDurationMins(Number(e.target.value))}
              required
              min={1}
              style={{ maxWidth: '200px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Launch Poll'}
          </button>
        </form>
      </div>

      {/* Poll List */}
      <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-4)', fontSize: 'var(--text-lg)' }}>Active & Past Polls</h3>
      <div className="card-stack">
        {polls.map(poll => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
          const isExpired = new Date(poll.expiresAt) < new Date();
          return (
            <div key={poll._id} className="card" style={{ padding: 'var(--sp-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)', fontWeight: 700 }}>{poll.question}</h4>
                  <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`} style={{ marginTop: 'var(--sp-2)', display: 'inline-flex' }}>
                    {isExpired ? 'EXPIRED' : `ACTIVE UNTIL ${new Date(poll.expiresAt).toLocaleTimeString()}`}
                  </span>
                </div>
                <button onClick={() => handleDelete(poll._id)} className="btn btn-sm btn-danger">
                  Delete
                </button>
              </div>

              {poll.options.map((opt, i) => {
                const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                return (
                  <div key={i} style={{ marginBottom: 'var(--sp-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)', marginBottom: 'var(--sp-1)' }}>
                      <span>{opt.name}</span>
                      <span style={{ fontWeight: 600 }}>{opt.votes} ({percentage}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Total Votes: {totalVotes} &middot; Expires: {new Date(poll.expiresAt).toLocaleString()}
              </div>
            </div>
          );
        })}
        {polls.length === 0 && <div className="card empty-state">No polls found.</div>}
      </div>
    </div>
  );
}
