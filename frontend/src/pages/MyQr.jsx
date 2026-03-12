import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

export default function MyQr() {
  const { user } = useAuth();

  if (!user) {
    return <div className="page-header">Loading...</div>;
  }

  // The QR scanner checks for either a JSON payload or just the studentId
  // The scanner sends this to POST /api/engagement/scan
  const qrData = user._id;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>My QR Code</h1>
        <p>Use this QR code for mess attendance and meal tracking.</p>
      </div>

      <div className="qr-container" style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--sp-12)' }}>
        <div className="card qr-card" style={{ padding: 'var(--sp-10)', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ background: '#fff', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            <QRCodeCanvas 
              value={qrData} 
              size={240} 
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
            />
          </div>
          <h3 style={{ marginTop: 'var(--sp-6)', fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>{user.name}</h3>
          <p style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', maxWidth: '300px', margin: 'var(--sp-2) auto 0' }}>
            Present this QR code to the mess staff at the scanner counter to mark your attendance.
          </p>
        </div>
      </div>
    </div>
  );
}
