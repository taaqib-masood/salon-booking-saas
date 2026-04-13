import React, { useEffect, useState } from 'react';
import axios from 'axios';
import IcalLink from './IcalLink';

const BookingConfirmation = ({ match }) => {
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/v1/appointments/${match.params.id}`);
        setAppointment(response.data);
      } catch (error) {
        console.log('Error fetching appointment:', error);
      }
    };

    fetchData();
  }, [match.params.id]);

  const handleCancel = async () => {
    try {
      await axios.delete(`/api/v1/appointments/${match.params.id}`);
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

Please note that this code assumes you have a `IcalLink` component to generate the .ics file and add it to calendar. Also, please replace `new Date(dateTime).toLocaleString()` with your own date formatting logic if needed. The `handleCancel` function will delete the appointment from the database when the Cancel Appointment button is clicked.