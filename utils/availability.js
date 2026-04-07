import { Staff } from '../models/Staff.js';
import { Branch } from '../models/Branch.js';
import { Appointment } from '../models/Appointment.js';

const getAvailableSlots = async (staffId, branchId, date, serviceDuration) => {
  const staffWorkingHours = await Staff.findById(staffId).select('workingHours');
  const branchWorkingHours = await Branch.findById(branchId).select('workingHours');
  const appointments = await Appointment.find({ date, staff: staffId }).select('time duration');
  
  // Compute available slots based on working hours and existing appointments
  let availableSlots = [];
  for (let i = 0; i < staffWorkingHours.length; i++) {
    const slotStartTime = new Date(date + 'T' + staffWorkingHours[i].start);
    const slotEndTime = new Date(date + 'T' + staffWorkingHours[i].end);
    
    for (let time = slotStartTime; time <= slotEndTime; time.setMinutes(time.getMinutes() + 30)) {
      if (isSlotAvailable(staffId, date, time.toISOString(), serviceDuration)) {
        availableSlots.push(time.toISOString().substring(11, 16));
      }
    }
  }
  
  return availableSlots;
};

const isSlotAvailable = (staffId, date, timeSlot, duration) => {
  // Check if the slot overlaps with any existing appointments for the staff member on that day
  const endTime = new Date(timeSlot);
  endTime.setMinutes(endTime.getMinutes() + duration);
  
  return !Appointment.exists({ staff: staffId, date, time: { $gte: timeSlot, $lt: endTime } });
};

export { getAvailableSlots, isSlotAvailable };