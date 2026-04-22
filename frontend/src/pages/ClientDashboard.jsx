import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import api from '../services/api';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    api
      .get('/appointments/my')
      .then(({ data }) => {
        setPastAppointments(
          (data.data || []).map((apt) => ({
            id: apt.id,
            date: new Date(apt.date).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' }),
            serviceName: apt.services?.name_en || 'Service',
            serviceId: apt.services?.id || '',
            stylist: apt.staff?.name || '—',
            price: apt.services?.price ? `${apt.services.price} AED` : '—',
            status: apt.status,
          }))
        );
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center items-center py-40"><span className="text-neutral animate-pulse tracking-widest uppercase text-xs">Loading your appointments…</span></div>;
  if (error) return <div className="text-center py-20 text-red-400 text-sm">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 animate-fade-in-up">
      <div className="mb-12">
        <h1 className="text-3xl font-serif text-charcoal mb-2">My Appointments</h1>
        <p className="text-neutral font-light text-sm">Welcome back. View your past luxury experiences and rebook effortlessly.</p>
      </div>

      <div className="space-y-6">
        {pastAppointments.map((apt) => (
          <div key={apt.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-neutral/10 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <p className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">{apt.date}</p>
              <h3 className="text-xl font-serif text-charcoal mb-2">{apt.serviceName}</h3>
              <p className="text-sm text-neutral/70">Stylist: <span className="font-medium text-charcoal">{apt.stylist}</span> <span className="mx-2 opacity-30">|</span> Total: <span className="font-serif text-charcoal">{apt.price}</span></p>
            </div>
            
            <div>
              <button 
                onClick={() => navigate('/book', { state: { serviceId: apt.serviceId } })}
                className="bg-charcoal text-cream px-8 py-4 rounded-xl hover:bg-primary hover:text-charcoal transition-all duration-300 uppercase tracking-widest text-[10px] font-bold shadow-luxury flex items-center space-x-2"
              >
                <span>↻ Rebook this Service</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && pastAppointments.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral/5">
          <p className="text-neutral mb-4">You have no past appointments.</p>
          <button onClick={() => navigate('/')} className="text-primary tracking-widest uppercase text-xs font-bold border-b border-primary pb-1">
            Browse Directory
          </button>
        </div>
      )}
    </div>
  );
}
