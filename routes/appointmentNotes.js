import express from 'express';
import { getNotes, addNote, deleteNote } from '../controllers/appointmentNotesController.js';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

// Mounted at /appointments/:id/notes via nested routing in appointments route
const router = express.Router({ mergeParams: true });
router.use(authenticate);
router.use(async (req, res, next) => {
  const { data, error } = await supabase.from('appointments').select('id')
    .eq('id', req.params.id).eq('tenant_id', req.staff.tenant_id).single();
  if (error || !data) return res.status(404).json({ error: 'Appointment not found' });
  next();
});

router.get('/',              getNotes);
router.post('/',             addNote);
router.delete('/:noteId',    deleteNote);

export default router;
