import React, { useEffect, useState } from 'react';
import axios from 'axios';
import IcalLink from './IcalLink';
import { useParams } from 'react-router-dom';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [cancelPolicy, setCancelPolicy] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/v1/appointments/${id}`);
        setAppointment(response.data);
        // Fetch cancellation policy from public tenant endpoint
        const tenantId = response.data?.tenant_id;
        if (tenantId) {
          const pub = await axios.get(`/api/v1/tenants/${tenantId}/public`).catch(() => null);
          if (pub?.data?.cancellationPolicy) setCancelPolicy(pub.data.cancellationPolicy);
        }
      } catch (error) {
        console.log('Error fetching appointment:', error);
      }
    };

    fetchData();
  }, [id]);

  const handleCancel = async () => {
    try {
      await axios.delete(`/api/v1/appointments/${id}`);
      alert('Appointment cancelled successfully');
    } catch (error) {
      console.log('Error cancelling appointment:', error);
    }
  };

  if (!appointment) return <div>Loading...</div>;

  const { confirmationNumber, service, stylist, branchAddress, dateTime, subtotal, vat, total } = appointment;

  return (
    <div>
      <h1>Booking Confirmation</h1>
      <p>Confirmation Number: {confirmationNumber}</p>
      <p>Service: {service}</p>
      <p>Stylist: {stylist}</p>
      <p>Branch Address: {branchAddress}</p>
      <p>Date and Time: {new Date(dateTime).toLocaleString()}</p>
      <div>
        <h2>Price Breakdown</h2>
        <p>Subtotal: AED {subtotal.toFixed(2)}</p>
        <p>VAT 5%: AED {vat.toFixed(2)}</p>
        <p>Total: AED {total.toFixed(2)}</p>
      </div>
      <IcalLink appointment={appointment} />
      {cancelPolicy && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f6f0', borderRadius: '8px', borderLeft: '3px solid #D4AF37' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: '0.25rem' }}>Cancellation Policy</p>
          <p style={{ fontSize: '0.875rem', color: '#2a2a2a' }}>{cancelPolicy}</p>
        </div>
      )}
      <button onClick={handleCancel}>Cancel Appointment</button>
    </div>
  );
};

export default BookingConfirmation;