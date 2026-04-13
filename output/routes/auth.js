import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import StaffModel from '../models/staff.model.js';
import CustomerModel from '../models/customer.model.js';
import GuestCustomerModel from '../models/guest-customer.model.js';

const router = express.Router();

router.post('/auth/staff/login', 
    body('email').isEmail(),
    body('password').exists(),
    async (req, res) => {
        const staff = await StaffModel.findOne({ email: req.body.email });
        if (!staff || !bcrypt.compareSync(req.body.password, staff.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET);
        res.json({ token });
    }
);

router.post('/auth/customer/register', 
    body('email').isEmail(),
    body('password').exists(),
    async (req, res) => {
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);
        const customer = new CustomerModel({ ...req.body, password: hashedPassword });
        await customer.save();
        res.json({ message: 'Customer registered successfully' });
    }
);

router.post('/auth/customer/login', 
    body('phone').isMobilePhone(),
    body('password').exists(),
    async (req, res) => {
        const customer = await CustomerModel.findOne({ phone: req.body.phone });
        if (!customer || !bcrypt.compareSync(req.body.password, customer.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);
        res.json({ token });
    }
);

router.post('/auth/customer/guest', 
    body('phone').isMobilePhone(),
    async (req, res) => {
        let guest = await GuestCustomerModel.findOne({ phone: req.body.phone });
        if (!guest) {
            guest = new GuestCustomerModel(req.body);
            await guest.save();
        }
        const token = jwt.sign({ id: guest._id }, process.env.JWT_SECRET);
        res.json({ token });
    }
);

export default router;