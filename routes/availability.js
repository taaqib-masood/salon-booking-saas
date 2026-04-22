import express from 'express';
import { getAvailableSlots } from '../controllers/availabilityController.js';

const router = express.Router();

// Public — no auth needed, frontend booking flow calls this
router.get('/slots', getAvailableSlots);

export default router;
