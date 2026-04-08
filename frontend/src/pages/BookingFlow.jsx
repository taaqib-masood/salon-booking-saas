import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [service, setService] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stylistId, setStylistId] = useState('');
  const [date, setDate] = useState(new Date());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [offerCode, setOfferCode] = useState('');

  const handleNextStep = async () => {
    switch (step) {
      case 1:
        // Validate and save service
        break;
      case 2:
        // Fetch staff data based on branchId
        try {
          const response = await axios.get(`/api/v1/staff?branchId=${branchId}`);
          setStylistId(response.data[0].id);
        } catch (error) {
          console.log('Error fetching staff data:', error);
        }
        break;
      case 3:
        // Fetch availability based on stylistId and date
        try {
          const response = await axios.get(`/api/v1/staff/${stylistId}/availability?date=${date}`);
          console.log('Availability:', response.data);
        } catch (error) {
          console.log('Error fetching availability data:', error);
        }
        break;
      case 4:
        // Validate and save customer details
        break;
      case 5:
        // Submit booking
        try {
          const response = await axios.post('/api/v1/appointments', {
            service,
            branchId,
            stylistId,
            date,
            name,
            phone,
            email,
            offerCode,
          });
          console.log('Booking response:', response.data);
        } catch (error) {
          console.log('Error submitting booking:', error);
        }
        break;
      default:
        break;
    }
    setStep(step + 1);
  };

  return (
    <div>
      <h2>Booking Flow</h2>
      <form onSubmit={handleNextStep}>
        {step === 1 && (
          <div>
            <label htmlFor="service">Service: </label>
            <input id="service" value={service} onChange={(e) => setService(e.target.value)} />
          </div>
        )}
        {step === 2 && (
          <div>
            <label htmlFor="branchId">Branch: </label>
            <input id="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)} />
          </div>
        )}
        {step === 3 && (
          <div>
            <DatePicker selected={date} onChange={(date) => setDate(date)} />
          </div>
        )}
        {step === 4 && (
          <div>
            <label htmlFor="name">Name: </label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            {/* Add more fields for phone and email */}
          </div>
        )}
        <button type="submit">Next</button>
      </form>
    </div>
  );
};

export default BookingFlow;