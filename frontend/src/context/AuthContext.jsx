import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Fetch full user profile from /api/auth/me
  const fetchUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data.user);
    } catch {
      // Token invalid or expired — clear everything
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  }, []);

  // On initial load, hydrate user if token exists
  useEffect(() => {
    if (token) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // Only run on mount, NOT on token change

  // Called after successful login
  const loginUser = async (jwt, basicUserData) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    // Set basic data immediately so ProtectedRoute lets user through
    setUser(basicUserData);
    // Then fetch full profile in background (non-blocking)
    try {
      const res = await getMe();
      setUser(res.data.user);
    } catch {
      // Keep the basic data if getMe fails — user is still logged in
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login: loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
