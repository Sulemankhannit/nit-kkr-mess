import { useState, useEffect } from 'react';
import PollCard from '../components/PollCard';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Polls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await api.getActivePolls();
      setPolls(res.data.polls || []);
    } catch (err) {
      console.error('Polls fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await api.votePoll(pollId, optionId);
      setMessage('Vote submitted! 🎉');
      fetchPolls();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to vote');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Polls</h1>
        <p>Vote on active polls and share your opinion</p>
      </div>

      {message && (
        <div style={{
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary-bg)',
          color: 'var(--color-primary-dark)',
          marginBottom: '20px',
          fontWeight: 500,
          fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      {polls.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📢</p>
          <h3 style={{ marginBottom: '8px' }}>No Active Polls</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            There are no active polls right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => (
            <PollCard
              key={poll._id}
              poll={poll}
              onVote={handleVote}
              hasVoted={poll.votedUsers?.includes(user?._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
