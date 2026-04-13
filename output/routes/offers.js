import express from 'express';
const router = express.Router();

// Import the Offer model
import { Offer } from '../models/Offer.js';

// GET /offers (admin/manager — full list with usedCount)
router.get('/', async (req, res) => {
    try {
        const offers = await Offer.find(); // Replace this with your own logic to fetch offers
        res.json(offers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /offers (admin)
router.post('/', async (req, res) => {
    try {
        const newOffer = new Offer({ ...req.body }); // Replace this with your own logic to create a new offer
        await newOffer.save();
        res.json(newOffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// PUT /offers/:id (admin)
router.put('/:id', async (req, res) => {
    try {
        const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Replace this with your own logic to update an offer
        if (!offer) return res.status(404).send('Offer not found');
        res.json(offer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE /offers/:id (admin)
router.delete('/:id', async (req, res) => {
    try {
        const offer = await Offer.findByIdAndRemove(req.params.id); // Replace this with your own logic to delete an offer
        if (!offer) return res.status(404).send('Offer not found');
        res.json({ msg: 'Offer removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /offers/validate (public — validate offer code for a given service and amount, returns discount details)
router.post('/validate', async (req, res) => {
    try {
        const { code, serviceId, amount } = req.body; // Replace this with your own logic to validate an offer
        const offer = await Offer.findOne({ code }); // Replace this with your own logic to fetch the offer by code
        if (!offer) return res.status(404).send('Offer not found');
        if (offer.serviceId !== serviceId || offer.amount < amount) return res.status(400).send('Invalid offer details');
        res.json({ discount: offer.discount }); // Replace this with your own logic to calculate the discount
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;