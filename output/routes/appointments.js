import express from 'express';
const router = express.Router();

// Import your controllers here
import { createAppointment, getAllAppointments, getOneAppointment, updateStatus, rescheduleAppointment, cancelAppointment } from '../controllers/appointmentsController.js';

router.post('/', createAppointment);
router.get('/', getAllAppointments);
router.get('/:id', getOneAppointment);
router.patch('/:id/status', updateStatus);
router.post('/:id/reschedule', rescheduleAppointment);
router.delete('/:id', cancelAppointment);

export default router;