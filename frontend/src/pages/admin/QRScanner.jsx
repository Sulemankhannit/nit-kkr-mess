import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { markAttendance, verifyRewardQR } from '../../services/api';

export default function QRScanner() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText) {
      scanner.pause(true);
      try {
        if (decodedText.startsWith('QR_REWARD_')) {
          const res = await verifyRewardQR(decodedText);
          setScanResult({
            success: true,
            message: res.data.message,
            remarks: [`Remaining Skips: ${res.data.remainingSkips || 0}`]
          });
        } else if (decodedText.startsWith('QR_GUEST_')) {
          // Guest passes are just single-use validation items in this context
          setScanResult({
            success: true,
            message: 'Guest Pass Validated!',
            remarks: ['One guest entry allowed for this meal']
          });
        } else {
          // Standard Attendance QR expects 24 char student ID
          const res = await markAttendance(decodedText);
          setScanResult({
            success: true,
            message: res.data.message,
            remarks: res.data.remarks
          });
        }
      } catch (err) {
        setScanResult({
          success: false,
          message: err.response?.data?.message || 'QR validation failed.'
        });
      }
      setTimeout(() => {
        setScanResult(null);
        scanner.resume();
      }, 3000);
    }

    function onScanFailure() {}

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>QR Scanner</h1>
        <p>Scan student QR codes to mark attendance</p>
      </div>

      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <div id="reader" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}></div>

        {scanResult && (
          <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
            <strong>{scanResult.message}</strong>
            {scanResult.success && scanResult.remarks && scanResult.remarks.length > 0 && (
              <ul style={{ listStyleType: 'disc', paddingLeft: 'var(--sp-5)', textAlign: 'left', marginTop: 'var(--sp-2)' }}>
                {scanResult.remarks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
