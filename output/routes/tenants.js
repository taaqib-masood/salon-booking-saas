import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Tenant from '../models/Tenant.js';
import TenantSubscription from '../models/TenantSubscription.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
  try {
    let tenant = new Tenant({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    
    await tenant.save();
    
    const today = new Date();
    const freeTrialEndsAt = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
  
    let subscription = new TenantSubscription({
      tenant: tenant._id,
      plan: 'free',
      startsAt: today,
      endsAt: freeTrialEndsAt,
    });
    
    await subscription.save();
    
    res.send({ message: 'Tenant created' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/login', async (req, res) => {
  try {
    let tenant = await Tenant.findOne({ email: req.body.email });
    
    if (!tenant) return res.status(400).send('Email or password is wrong');
  
    const validPassword = await bcrypt.compare(req.body.password, tenant.password);
    
    if (!validPassword) return res.status(400).send('Email or password is wrong');
  
    const token = jwt.sign({ _id: tenant._id }, process.env.TOKEN_SECRET);
    
    res.header('auth-token', token).send(token);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.tenant._id);
    
    if (!tenant) return res.status(401).send('Access Denied');
  
    res.json({
      name: tenant.name,
      email: tenant.email,
      subscription: await TenantSubscription.findOne({ tenant: tenant._id }),
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put('/me/settings', verifyToken, async (req, res) => {
  try {
    let tenant = await Tenant.findByIdAndUpdate(req.tenant._id, req.body, { new: true });
    
    if (!tenant) return res.status(401).send('Access Denied');
  
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/me/usage', verifyToken, async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.tenant._id);
    
    if (!tenant) return res.status(401).send('Access Denied');
  
    // TODO: Implement usage calculation logic here
  
    res.json({ branches: 0, staff: 0, bookings: 0 });
  } catch (error) {
    res.status(500).send(error);
  }
});

function verifyToken(req, res, next) {
  const token = req.header('auth-token');
  
  if (!token) return res.status(401).send('Access Denied');
  
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    
    req.tenant = verified;
    
    next();
  } catch (error) {
    res.status(400).send('Invalid Token');
  }
}

export default router;