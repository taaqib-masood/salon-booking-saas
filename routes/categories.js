import express from 'express';
const router = express.Router();

// Import the category service
import * as categoryService from '../services/categoryService.js';

// GET /categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await categoryService.findAll();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /categories/:id
router.get('/:id', async (req, res) => {
  try {
    const category = await categoryService.findById(req.params.id);
    if (!category) return res.status(404).json({ msg: 'Category not found' });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// POST /categories (admin)
router.post('/', async (req, res) => {
  try {
    const newCategory = await categoryService.create(req.body);
    res.json(newCategory);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// PUT /categories/:id (admin)
router.put('/:id', async (req, res) => {
  try {
    const updatedCategory = await categoryService.update(req.params.id, req.body);
    if (!updatedCategory) return res.status(404).json({ msg: 'Category not found' });
    res.json(updatedCategory);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// DELETE /categories/:id (admin)
router.delete('/:id', async (req, res) => {
  try {
    const category = await categoryService.remove(req.params.id);
    if (!category) return res.status(404).json({ msg: 'Category not found' });
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

export default router;