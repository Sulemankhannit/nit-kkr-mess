import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.verifyOTP(email, otpString);
      setSuccess('Account verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendOTP(email);
      setSuccess('New OTP sent! Check your email.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h2>Almost There! ✉️</h2>
        <p>We've sent a verification code to your email.</p>
      </div>
      <div className="auth-right">
        <div className="auth-form-container" style={{ textAlign: 'center' }}>
          <h1>Verify Your Email</h1>
          <p className="auth-subtitle">
            Enter the 6-digit code sent to <strong>{email || 'your email'}</strong>
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}

            <div className="otp-inputs">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  inputMode="numeric"
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary submit-btn btn-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="form-footer" style={{ marginTop: '20px' }}>
              Didn't receive the code?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Resend OTP
              </a>
            </div>

            <div className="form-footer">
              <Link to="/login">← Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
