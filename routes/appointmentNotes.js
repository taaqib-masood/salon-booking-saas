import express from 'express';
import { getNotes, addNote, deleteNote } from '../controllers/appointmentNotesController.js';
import { authenticate } from '../middleware/auth.js';

// Mounted at /appointments/:id/notes via nested routing in appointments route
const router = express.Router({ mergeParams: true });
router.use(authenticate);

router.get('/',              getNotes);
router.post('/',             addNote);
router.delete('/:noteId',    deleteNote);

export default router;
