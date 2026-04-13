import express from 'express';
const router = express.Router();

// Get services for mobile
router.get('/services', async (req, res) => {
  try {
    res.json({ 
      services: [],
      message: 'Mobile API - Services endpoint',
      pagination: { limit: 20, nextCursor: null }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments for mobile
router.get('/appointments', async (req, res) => {
  try {
    res.json({ appointments: [], message: 'Mobile API - Appointments' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
