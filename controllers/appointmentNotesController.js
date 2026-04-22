import { supabase } from '../lib/supabase.js';

// GET /api/v1/appointments/:id/notes
export async function getNotes(req, res) {
  const { data, error } = await supabase
    .from('appointment_notes')
    .select('*, staff(name,role)')
    .eq('appointment_id', req.params.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// POST /api/v1/appointments/:id/notes
export async function addNote(req, res) {
  const { note } = req.body;
  if (!note?.trim()) return res.status(400).json({ error: 'note is required' });

  const { data, error } = await supabase
    .from('appointment_notes')
    .insert({ appointment_id: req.params.id, staff_id: req.staff.id, note: note.trim() })
    .select('*, staff(name,role)')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

// DELETE /api/v1/appointments/:id/notes/:noteId
export async function deleteNote(req, res) {
  const { error } = await supabase
    .from('appointment_notes')
    .delete()
    .eq('id', req.params.noteId)
    .eq('staff_id', req.staff.id); // can only delete own notes
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Deleted' });
}
