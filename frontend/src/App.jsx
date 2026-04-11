import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import { theme } from './styles/theme';
import Navbar from './components/Navbar';
import ServiceBrowser from './pages/ServiceBrowser';
import BookingFlow from './pages/BookingFlow';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminDashboard from './pages/AdminDashboard';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div {...pageVariants}><ServiceBrowser /></motion.div>} />
        <Route path="/book" element={<motion.div {...pageVariants}><BookingFlow /></motion.div>} />
        <Route path="/booking/:id" element={<motion.div {...pageVariants}><BookingConfirmation /></motion.div>} />
        <Route path="/admin" element={<motion.div {...pageVariants}><AdminDashboard /></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <div className="min-h-screen bg-midnight text-pearl font-inter">
              <Navbar />
              <main className="pt-16">
                <AnimatedRoutes />
              </main>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </LangProvider>
  );
}
