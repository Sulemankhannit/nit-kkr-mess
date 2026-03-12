export default function PollCard({ poll, onVote, hasVoted }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const isExpired = new Date(poll.expiresAt) < new Date();

  const timeLeft = () => {
    const diff = new Date(poll.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m left`;
  };

  return (
    <div className="poll-card card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <h3>{poll.question}</h3>
        <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
          {timeLeft()}
        </span>
      </div>
      <div className="poll-meta">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>

      <div className="poll-options">
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          return (
            <div
              key={option._id}
              className={`poll-option ${hasVoted ? 'voted' : ''}`}
              onClick={() => !hasVoted && !isExpired && onVote(poll._id, option._id)}
              style={{ cursor: hasVoted || isExpired ? 'default' : 'pointer' }}
            >
              <span className="option-name">{option.name}</span>
              {(hasVoted || isExpired) && (
                <>
                  <div className="poll-bar-bg" style={{ maxWidth: '100px' }}>
                    <div className="poll-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="option-votes">{pct}%</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
