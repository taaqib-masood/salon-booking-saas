import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Register the account
      await axios.post('/api/v1/auth/customer/register', form);
      // Then log in via AuthContext so token/user state is set properly
      await login(form.phone, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel rounded-2xl w-full max-w-md p-10 md:p-12 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-serif text-primary tracking-widest">LA MAISON</Link>
          <p className="text-cream/50 text-xs tracking-[0.3em] uppercase mt-2">Create Your Account</p>
        </div>

        {error && (
          <div className="bg-rose/10 border border-rose/30 text-rose text-sm px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {[
            { label: 'Full Name', field: 'name', type: 'text' },
            { label: 'Phone Number', field: 'phone', type: 'tel' },
            { label: 'Email Address', field: 'email', type: 'email' },
            { label: 'Password', field: 'password', type: 'password' },
          ].map(({ label, field, type }) => (
            <div key={field} className="relative group">
              <input
                id={field}
                type={type}
                required
                value={form[field]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={label}
                className="w-full bg-white/5 border-b border-white/20 text-cream placeholder-cream/30 py-3 px-1 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <label htmlFor={field} className="absolute -top-4 left-0 text-[10px] text-primary/70 uppercase tracking-widest">
                {label}
              </label>
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-primary text-charcoal py-4 font-semibold uppercase tracking-widest text-sm hover:bg-cream transition-colors mt-4 flex justify-center items-center h-14"
          >
            {loading ? <div className="w-5 h-5 border-2 border-charcoal border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-cream/40 text-xs mt-8 tracking-wider">
          Already a member?{' '}
          <Link to="/login" className="text-primary hover:text-cream transition-colors underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
