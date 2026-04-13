import express from 'express';
const router = express.Router();

// Get monthly commission for staff
router.get('/monthly/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const { month, year } = req.query;
    res.json({ message: 'Commission endpoint', staffId, month, year });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate commission report
router.post('/report', async (req, res) => {
  try {
    const { month, year } = req.body;
    res.json({ message: 'Report generated', month, year });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
