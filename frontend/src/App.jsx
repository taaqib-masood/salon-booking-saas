import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import ServiceBrowser from './pages/ServiceBrowser';
import BookingFlow from './pages/BookingFlow';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminDashboard from './pages/AdminDashboard';
import AIPerformancePage from './pages/AIPerformancePage';
import ClientDashboard from './pages/ClientDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth, useLang } from './contexts';

const Header = () => {
  const { lang, setLang } = useLang();
  const { isAuthenticated, logout, isStaff } = useAuth();

  return (
    <nav className="bg-charcoal px-8 py-5 border-b border-primary/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-serif text-primary tracking-widest">
          LA MAISON
        </Link>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-cream hover:text-primary transition-colors text-sm font-medium tracking-wider"
          >
            {lang === 'en' ? 'عربي' : 'ENGLISH'}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {isStaff ? (
                <div className="flex items-center gap-5">
                  <Link to="/admin" className="text-cream hover:text-primary transition-colors text-sm uppercase tracking-wider">Dashboard</Link>
                  <Link to="/admin/ai-performance" className="text-primary hover:text-cream transition-colors text-sm uppercase tracking-wider font-semibold">AI Stats</Link>
                </div>
              ) : (
                <Link to="/dashboard" className="text-cream hover:text-primary transition-colors text-sm uppercase tracking-wider">My Bookings</Link>
              )}
              <button
                onClick={logout}
                className="border border-primary text-primary px-5 py-2 hover:bg-primary hover:text-charcoal transition-colors text-sm uppercase tracking-wider"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/register"
                className="text-cream hover:text-primary transition-colors text-sm uppercase tracking-wider"
              >
                Join
              </Link>
              <Link
                to="/login"
                className="bg-primary text-charcoal px-6 py-2.5 hover:bg-cream transition-colors text-sm uppercase tracking-wider font-semibold"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={
          <div className="min-h-screen bg-cream text-charcoal font-sans overflow-x-hidden">
            <Header />
            <div className="max-w-7xl mx-auto p-6 md:p-8">
              <Routes>
                <Route path="/" element={<ServiceBrowser />} />
                <Route path="/book" element={<BookingFlow />} />
                <Route path="/booking/:id" element={<BookingConfirmation />} />
                <Route path="/dashboard" element={<ClientDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/ai-performance" element={<AIPerformancePage />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
