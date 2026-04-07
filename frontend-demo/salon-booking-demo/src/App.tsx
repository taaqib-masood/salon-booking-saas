
import React, { useState } from 'react';
import './App.css';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  icon: string;
  description: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  rating: number;
  image: string;
}

interface BookingData {
  service: Service | null;
  staff: Staff | null;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
}

function App() {
  const [step, setStep] = useState<'services' | 'staff' | 'details' | 'confirmation'>('services');
  const [booking, setBooking] = useState<BookingData>({
    service: null,
    staff: null,
    date: '',
    time: '',
    customerName: '',
    customerPhone: ''
  });

  const services: Service[] = [
    { id: '1', name: 'Hair Cut & Style', price: 150, duration: 45, icon: '✂️', description: 'Professional haircut and styling' },
    { id: '2', name: 'Hair Color Premium', price: 350, duration: 120, icon: '🎨', description: 'Premium hair coloring with Olaplex' },
    { id: '3', name: 'Manicure & Pedicure', price: 180, duration: 60, icon: '💅', description: 'Complete nail care treatment' },
    { id: '4', name: 'Facial Treatment', price: 250, duration: 50, icon: '💆', description: 'Deep cleansing and hydration' },
    { id: '5', name: 'Massage Therapy', price: 280, duration: 60, icon: '💆‍♂️', description: 'Relaxing full body massage' },
    { id: '6', name: 'Keratin Treatment', price: 450, duration: 90, icon: '💇', description: 'Smoothing hair treatment' },
  ];

  const staff: Staff[] = [
    { id: '1', name: 'Sarah Ahmed', role: 'Senior Stylist', rating: 4.9, image: '👩' },
    { id: '2', name: 'Mohammed Ali', role: 'Color Specialist', rating: 4.8, image: '👨' },
    { id: '3', name: 'Fatima Hassan', role: 'Nail Artist', rating: 4.7, image: '💅' },
    { id: '4', name: 'Omar Khalid', role: 'Massage Therapist', rating: 4.9, image: '💆' },
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const calculateVAT = (price: number) => price * 0.05;
  const calculateTotal = (price: number) => price + calculateVAT(price);

  const handleBookingSubmit = () => {
    if (!booking.customerName || !booking.customerPhone) {
      alert('Please enter your name and phone number');
      return;
    }
    setStep('confirmation');
    console.log('Booking submitted:', booking);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-700 to-amber-500 text-white py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">✨ Luxe Salon Dubai ✨</h1>
          <p className="text-amber-100 mt-2">Premium Beauty & Hair Services • Dubai Marina</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-10 max-w-2xl mx-auto">
          {[
            { step: 'services', label: 'Services' },
            { step: 'staff', label: 'Staff' },
            { step: 'details', label: 'Details' },
            { step: 'confirmation', label: 'Confirm' }
          ].map((s, idx) => (
            <div key={s.step} className="text-center flex-1">
              <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-semibold ${
                step === s.step ? 'bg-amber-500 text-white ring-4 ring-amber-200' :
                (step === 'staff' && s.step === 'services') ||
                (step === 'details' && ['services', 'staff'].includes(s.step)) ||
                (step === 'confirmation' && s.step !== 'confirmation') ? 'bg-amber-500 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                {idx + 1}
              </div>
              <p className="text-sm mt-2 text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Step 1: Services */}
        {step === 'services' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Your Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <div
                  key={service.id}
                  onClick={() => {
                    setBooking({ ...booking, service });
                    setStep('staff');
                  }}
                  className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-amber-400"
                >
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="font-bold text-lg text-gray-800">{service.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                  <p className="text-gray-600 text-sm mt-2">{service.duration} minutes</p>
                  <p className="text-amber-600 font-bold text-xl mt-3">AED {service.price}</p>
                  <p className="text-xs text-gray-400 mt-1">+5% VAT = AED {(service.price * 0.05).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Staff Selection */}
        {step === 'staff' && booking.service && (
          <div>
            <button onClick={() => setStep('services')} className="text-amber-600 mb-4 hover:underline">← Back to Services</button>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Choose Your Stylist</h2>
            <p className="text-gray-600 mb-6">For: {booking.service.name} • AED {booking.service.price}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {staff.map(staffer => (
                <div
                  key={staffer.id}
                  onClick={() => {
                    setBooking({ ...booking, staff: staffer });
                    setStep('details');
                  }}
                  className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all text-center border-2 border-transparent hover:border-amber-400"
                >
                  <div className="text-6xl mb-3">{staffer.image}</div>
                  <h3 className="font-bold text-gray-800">{staffer.name}</h3>
                  <p className="text-gray-500 text-sm">{staffer.role}</p>
                  <p className="text-amber-500 text-sm mt-2">★ {staffer.rating} / 5.0</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Booking Details */}
        {step === 'details' && booking.service && booking.staff && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep('staff')} className="text-amber-600 mb-4 hover:underline">← Back to Staff</button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete Your Booking</h2>
            
            <div className="bg-amber-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold mb-3 text-gray-800">Booking Summary</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="text-gray-500">Service:</span> {booking.service.name}</p>
                <p><span className="text-gray-500">Stylist:</span> {booking.staff.name}</p>
                <p><span className="text-gray-500">Duration:</span> {booking.service.duration} minutes</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Select Date</label>
              <input
                type="date"
                value={booking.date}
                onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Select Time</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setBooking({ ...booking, time })}
                    className={`p-2 rounded-lg border transition-all ${
                      booking.time === time 
                        ? 'bg-amber-500 text-white border-amber-500' 
                        : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Your Name</label>
              <input
                type="text"
                value={booking.customerName}
                onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">Phone Number (WhatsApp)</label>
              <input
                type="tel"
                value={booking.customerPhone}
                onChange={(e) => setBooking({ ...booking, customerPhone: e.target.value })}
                placeholder="+971 XX XXX XXXX"
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-400"
                required
              />
              <p className="text-xs text-gray-500 mt-1">We'll send confirmation via WhatsApp</p>
            </div>

            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <h3 className="font-bold mb-3 text-gray-800">Price Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>AED {booking.service.price}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (5% UAE):</span>
                  <span>AED {calculateVAT(booking.service.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                  <span>Total:</span>
                  <span className="text-amber-600">AED {calculateTotal(booking.service.price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookingSubmit}
              className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-all"
            >
              Confirm Booking
            </button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirmation' && booking.service && (
          <div className="max-w-md mx-auto text-center">
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a confirmation WhatsApp to <strong>{booking.customerPhone}</strong>
            </p>
            <div className="bg-green-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold mb-3 text-green-800">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Booking ID:</strong> #SAL{Math.floor(Math.random() * 10000)}</p>
                <p><strong>Service:</strong> {booking.service.name}</p>
                <p><strong>Stylist:</strong> {booking.staff?.name}</p>
                <p><strong>Date:</strong> {booking.date}</p>
                <p><strong>Time:</strong> {booking.time}</p>
                <p><strong>Total:</strong> AED {calculateTotal(booking.service.price).toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-all"
            >
              Book Another Service
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 Luxe Salon Dubai • UAE VAT Registered: TRN 123456789</p>
          <p className="text-gray-400 text-sm mt-2">📍 Dubai Marina Branch • 📞 +971 4 123 4567</p>
          <p className="text-gray-500 text-xs mt-4">Hours: Sat-Thu 9AM-9PM | Fri 2PM-9PM</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
