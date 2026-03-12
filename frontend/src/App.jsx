import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Crowd from './pages/Crowd';
import Polls from './pages/Polls';
import Feedback from './pages/Feedback';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Scanner from './pages/Scanner';
import Rebates from './pages/Rebates';
import MyQr from './pages/MyQr';

import AdminDashboard from './pages/admin/AdminDashboard';
import QRScanner from './pages/admin/QRScanner';
import StudentSearch from './pages/admin/StudentSearch';
import MenuManagement from './pages/admin/MenuManagement';
import PollManagement from './pages/admin/PollManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminBilling from './pages/admin/AdminBilling';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyOTP />} />

          {/* Protected dashboard routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/my-qr" element={<MyQr />} />
            <Route path="/crowd" element={<Crowd />} />
            <Route path="/polls" element={<Polls />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/rebates" element={<Rebates />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/scanner" element={<Scanner />} />
          </Route>

          {/* Admin protected routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="scanner" element={<QRScanner />} />
            <Route path="students" element={<StudentSearch />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="polls" element={<PollManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="billing" element={<AdminBilling />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
