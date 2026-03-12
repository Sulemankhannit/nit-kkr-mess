import axios from 'axios';

const API = axios.create({ 
  // Read VITE_API_URL from deployment environment, fallback to '/api' for local proxy
  baseURL: import.meta.env.VITE_API_URL || '/api' 
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally — clear stale tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token on 401 for non-login routes
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────
export const login = (email, password) =>
  API.post('/auth/login', { email, password });

export const register = (name, email, password, role = 'student') =>
  API.post('/auth/register', { name, email, password, role });

export const verifyOTP = (email, otp) =>
  API.post('/auth/verify', { email, otp });

export const resendOTP = (email) =>
  API.post('/auth/resend-otp', { email });

export const getMe = () =>
  API.get('/auth/me');

// ─── Menu ─────────────────────────────────────────
export const getTodayMeals = () =>
  API.get('/menu/today');

// ─── RSVP ─────────────────────────────────────────
export const toggleRsvp = (mealId, status) =>
  API.post(`/rsvp/${mealId}`, { status });

// ─── Billing ──────────────────────────────────────
export const getLedger = () =>
  API.get('/billing/ledger');

export const applyRebate = (data) =>
  API.post('/billing/rebate', data);

export const getMyRebates = () =>
  API.get('/billing/myrebates');

export const claimReward = () =>
  API.post('/billing/claim-reward');

export const buyGuestPass = () =>
  API.post('/billing/guest-pass');

// ─── Engagement ───────────────────────────────────
export const getActivePolls = () =>
  API.get('/engagement/poll/active');

export const votePoll = (pollId, optionId) =>
  API.post(`/engagement/poll/${pollId}/vote`, { optionId });

export const submitFeedback = (mealId, rating, comments) =>
  API.post(`/engagement/feedback/${mealId}`, { rating, comments });

export const getLiveCrowd = () =>
  API.get('/engagement/crowd');

export const getStudentAnalytics = () =>
  API.get('/engagement/student-analytics');

// ─── Admin ────────────────────────────────────────
export const getAdminCookSheet = () =>
  API.get('/admin/cook-sheet');

export const getAdminAnalytics = () =>
  API.get('/admin/analytics');

export const markAttendance = (studentId) =>
  API.post('/admin/attendance/mark', { studentId });

export const verifyRewardQR = (payload) =>
  API.post('/admin/reward/verify', { payload });

export const searchStudent = (rollNumber) =>
  API.get(`/admin/student/search?rollNumber=${rollNumber}`);

export const deleteStudent = (id) =>
  API.delete(`/admin/student/${id}`);

export const getPendingRebates = () =>
  API.get('/billing/admin/rebates');

export const updateRebateStatus = (id, status) =>
  API.put(`/billing/admin/rebate/${id}`, { status });

export const generateInvoices = () =>
  API.post('/billing/admin/generate-invoices', {}, { responseType: 'blob' });

export const getAdminPolls = () =>
  API.get('/engagement/poll/admin/all');

export const createPoll = (data) =>
  API.post('/engagement/poll/create', data);

export const getAllFeedback = () =>
  API.get('/admin/feedback/all');

export default API;
