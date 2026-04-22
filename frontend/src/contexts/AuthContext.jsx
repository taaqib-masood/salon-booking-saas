import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

function decodeUser(token) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    // Treat expired tokens as absent — auto-clean on next API call
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token');
    // Validate expiry on init — clear if stale
    if (t && !decodeUser(t)) { localStorage.removeItem('token'); return null; }
    return t;
  });
  const [user, setUser] = useState(() => decodeUser(localStorage.getItem('token')));

  const isAuthenticated = !!token;
  const isStaff = !!(user && user.role && user.type !== 'customer');
  const role = user?.role || user?.type || null;

  const _setSession = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(decodeUser(newToken));
  };

  const login = async (phone, password) => {
    const { data } = await axios.post('/api/v1/auth/customer/login', { phone, password });
    _setSession(data.token);
  };

  const loginStaff = async (email, password) => {
    const { data } = await axios.post('/api/v1/auth/staff/login', { email, password });
    _setSession(data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginStaff, logout, isAuthenticated, isStaff, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
