import express from 'express';
import bcrypt from 'bcryptjs';
import StaffModel from '../models/Staff.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const staffs = await StaffModel.find(req.query).populate('branch role specialty');
    res.json(staffs);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const staff = await StaffModel.findById(req.params.id);
    if (!staff) return res.status(404).send({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    let staff = new StaffModel({ ...req.body, password: hashedPassword });
    staff = await staff.save();
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const staff = await StaffModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!staff) return res.status(404).send({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const staff = await StaffModel.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!staff) return res.status(404).send({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get('/:id/schedule', async (req, res) => {
  try {
    const staff = await StaffModel.findById(req.params.id);
    if (!staff) return res.status(404).send({ message: 'Staff not found' });
    // Assuming schedule is stored in the Staff model as an array of objects with date and time fields
    const daySchedule = staff.schedule.filter((item) => item.date === req.query.date);
    res.json(daySchedule);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get('/:id/availability', async (req, res) => {
  try {
    const staff = await StaffModel.findById(req.params.id);
    if (!staff) return res.status(404).send({ message: 'Staff not found' });
    // Assuming availability is stored in the Staff model as an array of objects with date, time and serviceId fields
    const availableTimeSlots = staff.availability
      .filter((item) => item.date === req.query.date && item.serviceId === req.query.serviceId);
    res.json(availableTimeSlots);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

export default router;