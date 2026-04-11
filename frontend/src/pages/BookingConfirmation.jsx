import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import IcalLink from './IcalLink';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/v1/appointments/${id}`);
        setAppointment(response.data);
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
      <button onClick={handleCancel}>Cancel Appointment</button>
    </div>
  );
};

export default BookingConfirmation;
