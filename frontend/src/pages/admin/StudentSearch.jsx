import { useState } from 'react';
import { searchStudent, deleteStudent } from '../../services/api';

export default function StudentSearch() {
  const [rollNumber, setRollNumber] = useState('');
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!rollNumber) return;

    setError('');
    setStudent(null);
    setLoading(true);

    try {
      const res = await searchStudent(rollNumber);
      setStudent(res.data.student);
    } catch (err) {
      setError(err.response?.data?.message || 'Student not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student and all associated data?')) {
      try {
        await deleteStudent(student._id);
        setStudent(null);
        setRollNumber('');
        alert('Student successfully deleted.');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete student.');
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Student Search</h1>
        <p>Lookup student details, dues, and status</p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Enter Roll Number (e.g. 124102030)"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            style={{ margin: 0, flex: 1, minWidth: '200px', maxWidth: '400px' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <div style={{ color: 'var(--color-danger)', marginTop: 'var(--sp-3)', fontSize: 'var(--text-base)' }}>{error}</div>}
      </div>

      {student && (
        <div className="card" style={{ padding: 'var(--sp-6)' }}>
          <h3 className="section-heading">Student Profile: {student.name}</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <p>Email</p>
              <p>{student.email}</p>
            </div>
            <div className="detail-item">
              <p>Current Wallet Balance</p>
              <p>₹{student.currentBalance}</p>
            </div>
            <div className="detail-item">
              <p>Guest Dues Pending</p>
              <p style={{ color: 'var(--color-danger)' }}>₹{student.guestDues || 0}</p>
            </div>
            <div className="detail-item">
              <p>Available Skips</p>
              <p>{student.skippedMeals || 0}</p>
            </div>
            <div className="detail-item">
              <p>Approved Rebates</p>
              <p>{student.approvedRebates || 0}</p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete Student Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
