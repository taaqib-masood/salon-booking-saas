import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts';

export default function LoginPage() {
  const [isStaff, setIsStaff] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isStaff) {
        await loginStaff(identifier, password);
        navigate('/admin');
      } else {
        await login(identifier, password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('/bg-login.png')` }}
    >
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"></div>
      
      <div className="relative glass-panel rounded-2xl w-full max-w-md p-10 shadow-luxury mx-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl text-primary font-serif tracking-widest mb-2">LA MAISON</h1>
          <p className="text-cream/80 text-sm tracking-widest uppercase font-light">Hair & Beauty</p>
        </div>

        <div className="flex mb-8 bg-charcoal/50 rounded-lg p-1 backdrop-blur-md">
          <button 
            className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${!isStaff ? 'bg-primary text-charcoal shadow-md' : 'text-cream/70 hover:text-primary'}`}
            onClick={() => setIsStaff(false)}
          >
            Client Access
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${isStaff ? 'bg-primary text-charcoal shadow-md' : 'text-cream/70 hover:text-primary'}`}
            onClick={() => setIsStaff(true)}
          >
            Staff Portal
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/50 border border-red-500/50 text-red-200 text-sm rounded-lg text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-cream/70 text-xs font-semibold uppercase tracking-wider mb-2">
              {isStaff ? 'Email Address' : 'Phone Number'}
            </label>
            <input 
              type={isStaff ? 'email' : 'tel'} 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-charcoal/60 border border-cream/10 text-cream px-4 py-3 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-cream/30"
              placeholder={isStaff ? 'staff@lamaison.ae' : '+971 50 000 0000'}
              required
            />
          </div>

          <div>
            <label className="block text-cream/70 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-charcoal/60 border border-cream/10 text-cream px-4 py-3 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-cream/30"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <a href="#" className="text-xs text-primary/80 hover:text-primary transition-colors">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-charcoal font-semibold py-4 rounded-lg shadow-glow hover:opacity-90 transition-opacity uppercase tracking-wider text-sm mt-4 disabled:opacity-60 flex justify-center items-center h-14"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
              : 'Sign In'}
          </button>
        </form>

        {!isStaff && (
          <p className="mt-8 text-center text-cream/60 text-sm">
            New to La Maison? <Link to="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
