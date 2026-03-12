import { useState, useEffect } from 'react';
import { getPendingRebates, updateRebateStatus, generateInvoices } from '../../services/api';

export default function AdminBilling() {
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchRebates();
  }, []);

  const fetchRebates = async () => {
    try {
      const res = await getPendingRebates();
      setRebates(res.data.rebates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this rebate?`)) return;
    try {
      await updateRebateStatus(id, status);
      // Update local state to visually show the approval/rejection instead of refetching immediately
      setRebates(prev => prev.map(r => r._id === id ? { ...r, uiStatus: status } : r));
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${status} rebate.`);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!window.confirm("Generate master ledger and email PDF bills to all students? This may take several seconds.")) return;
    setIsGenerating(true);
    try {
      const response = await generateInvoices();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Master_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      alert('Master Ledger Generated and Downloaded Successfully! Emails have been sent.');
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoices. Check server logs.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Billing Overview</h1>
        <p>Monitor system revenue and process pending rebates</p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
          <h3 className="section-heading" style={{ margin: 0 }}>Invoice Generation</h3>
          <button 
            className="btn btn-primary" 
            onClick={handleGenerateInvoices} 
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating & Emailing...' : 'Generate & Email Invoices'}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Generates a master ledger PDF for the admin and emails individual invoice PDFs to all students.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <h3 className="section-heading">Pending Rebate Requests</h3>

        {rebates.length === 0 ? (
          <div className="empty-state">No pending rebate requests.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rebates.map(r => (
                  <tr key={r._id}>
                    <td>{r.user?.name || 'Unknown'}</td>
                    <td>{r.user?.email ? r.user.email.split('@')[0] : 'N/A'}</td>
                    <td>{new Date(r.startDate).toLocaleDateString()}</td>
                    <td>{new Date(r.endDate).toLocaleDateString()}</td>
                    <td className="truncate" title={r.reason}>{r.reason}</td>
                    <td className="actions-cell">
                      {r.uiStatus ? (
                        <span className={`badge ${r.uiStatus === 'approved' ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 'bold' }}>
                          {r.uiStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAction(r._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleAction(r._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
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
