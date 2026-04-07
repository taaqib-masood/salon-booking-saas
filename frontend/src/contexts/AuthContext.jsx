import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const isAuthenticated = !!token;
  const isStaff = user && user.role === 'staff';
  const role = user ? user.role : null;

  useEffect(() => {
    if (isAuthenticated) {
      axios.get('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
        .then(response => setUser(response.data))
        .catch(error => logout());
    } else {
      setUser(null);
    }
  }, [isAuthenticated, token]);
  
  const login = async (phone, password) => {
    try {
      const response = await axios.post('/api/auth', { phone, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
    } catch (error) {
      throw error;
    }
  };
  
  const loginStaff = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/staff', { email, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
    } catch (error) {
      throw error;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, token, login, loginStaff, logout, isAuthenticated, isStaff, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);