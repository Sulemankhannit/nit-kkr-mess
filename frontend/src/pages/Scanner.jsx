import { useEffect, useRef, useState } from 'react';
import * as api from '../services/api';

export default function Scanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [message, setMessage] = useState('Point camera at student QR code');
  const [stream, setStream] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus('scanning');
      setMessage('Scanning... Point camera at QR code');

      // Start scanning interval
      scanIntervalRef.current = setInterval(() => {
        captureAndScan();
      }, 1000);
    } catch (err) {
      setStatus('error');
      setMessage('Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndScan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      detector.detect(imageData).then(barcodes => {
        if (barcodes.length > 0) {
          handleQRResult(barcodes[0].rawValue);
        }
      }).catch(() => {});
    }
  };

  const handleQRResult = async (data) => {
    // Pause scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    setStatus('processing');
    setMessage('Processing...');

    try {
      // The QR code should contain the student ID or a JSON payload
      let payload;
      try {
        payload = JSON.parse(data);
      } catch {
        payload = { studentId: data };
      }

      const res = await api.default.post('/engagement/scan', payload);
      setStatus('success');
      setMessage(res.data?.message || 'Attendance marked successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to mark attendance';
      if (errorMsg.toLowerCase().includes('already')) {
        setStatus('warning');
        setMessage('Already marked for this meal');
      } else if (errorMsg.toLowerCase().includes('invalid')) {
        setStatus('error');
        setMessage('Invalid QR code');
      } else {
        setStatus('error');
        setMessage(errorMsg);
      }
    }

    // Resume scanning after 3 seconds
    setTimeout(() => {
      setStatus('scanning');
      setMessage('Scanning... Point camera at QR code');
      scanIntervalRef.current = setInterval(() => {
        captureAndScan();
      }, 1000);
    }, 3000);
  };

  const statusColors = {
    idle: 'var(--color-text-muted)',
    scanning: 'var(--color-info)',
    processing: 'var(--color-warning)',
    success: 'var(--color-primary)',
    warning: 'var(--color-warning)',
    error: 'var(--color-danger)',
  };

  const statusIcons = {
    idle: '📷',
    scanning: '🔍',
    processing: '⏳',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>QR Scanner</h1>
        <p>Scan student QR codes to mark attendance</p>
      </div>

      <div className="scanner-container">
        <div className="scanner-card card">
          <div className="scanner-viewport">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="scanner-video"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="scanner-overlay">
              <div className="scanner-frame" />
            </div>
          </div>

          <div className="scanner-status" style={{ borderLeftColor: statusColors[status] }}>
            <span className="scanner-status-icon">{statusIcons[status]}</span>
            <span className="scanner-status-text">{message}</span>
          </div>
        </div>

        <div className="scanner-instructions card">
          <h3>Instructions</h3>
          <ul>
            <li>Hold the camera steady over the student's QR code</li>
            <li>Ensure good lighting for best results</li>
            <li>Wait for the confirmation message</li>
            <li>The scanner auto-resumes after each scan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
