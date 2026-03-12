import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function Login() {
  const [loginType, setLoginType] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(email, password);
      const { token, name, role } = res.data;

      if (!token) {
        setError('No token received from server. Please try again.');
        setLoading(false);
        return;
      }

      if (loginType === 'admin' && role !== 'admin') {
        setError('Access denied. This account does not have administrator privileges.');
        setLoading(false);
        return;
      }

      await login(token, { name, role, email });
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Show the actual backend error message
      if (err.response) {
        const data = err.response.data;
        const status = err.response.status;
        // Extract message — data could be JSON object, string, or HTML
        if (data && typeof data === 'object' && data.message) {
          setError(data.message);
        } else if (typeof data === 'string' && !data.startsWith('<!')) {
          setError(data);
        } else {
          // Map common HTTP codes to user-friendly messages
          const statusMessages = {
            400: 'Invalid email or password.',
            401: 'Unauthorized. Please check your credentials.',
            403: 'Please verify your email first.',
            404: 'Login service unavailable.',
            500: 'Server error. Please try again later.'
          };
          setError(statusMessages[status] || `Login failed (error ${status}).`);
        }
      } else if (err.request) {
        // Request was made but no response — backend probably not running
        setError('Cannot reach the server. Make sure the backend is running on port 5000.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <h2>Welcome Back 👋</h2>
        <p>Login to manage your meals and track your food impact.</p>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <h1>Sign In</h1>
          <p className="auth-subtitle">Enter your NIT KKR credentials to continue</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="login-toggle-container">
              <button 
                type="button" 
                className={`login-toggle-btn ${loginType === 'student' ? 'active' : ''}`} 
                onClick={() => setLoginType('student')}
              >
                Login as Student
              </button>
              <button 
                type="button" 
                className={`login-toggle-btn ${loginType === 'admin' ? 'active' : ''}`} 
                onClick={() => setLoginType('admin')}
              >
                Login as Admin
              </button>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="yourname@nitkkr.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary submit-btn btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="form-footer">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
