import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Staff } from '../models/staff.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error();
    
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const staff = await Staff.findOne({ _id: decodedToken._id });
    
    if (!staff) throw new Error();
    
    req.staff = staff;
    next();
  } catch (error) {
    res.status(401).send('Authentication failed');
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.staff.role)) {
      return res.status(403).send('Insufficient role');
    }
    
    next();
  };
};