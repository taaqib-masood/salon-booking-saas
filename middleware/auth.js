import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

async function resolveToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token');
  return jwt.verify(token, JWT_SECRET);
}

export const authenticate = async (req, res, next) => {
  try {
    const decoded = await resolveToken(req);

    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, name, email, role, tenant_id, branch_id, is_deleted')
      .eq('id', decoded.id)
      .eq('is_deleted', false)
      .single();

    if (error || !staff) throw new Error('Staff not found');
    req.staff = staff;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authenticateCustomer = async (req, res, next) => {
  try {
    const decoded = await resolveToken(req);
    if (decoded.type !== 'customer') throw new Error('Not a customer token');

    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, tenant_id')
      .eq('id', decoded.id)
      .single();

    if (error || !customer) throw new Error('Customer not found');
    req.customer = customer;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.staff.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
  };
};
