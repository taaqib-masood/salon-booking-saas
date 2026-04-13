
import express from 'express';
const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    res.json({ items: [], message: 'Inventory list' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add inventory item
router.post('/', async (req, res) => {
  try {
    res.status(201).json({ message: 'Item created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock
router.put('/:id/stock', async (req, res) => {
  try {
    res.json({ message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
