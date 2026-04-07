import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';

export function pointsEarned(totalAmountAED) {
    return Math.floor(totalAmountAED / 10);
}

export async function applyLoyaltyEarn(customerId, appointmentId, totalAmount) {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    const points = pointsEarned(totalAmount);
    customer.points += points;
    await customer.save();

    const loyaltyTransaction = new LoyaltyTransaction({
        customer: customer._id,
        appointmentId,
        points,
        type: 'earn',
    });
    await loyaltyTransaction.save();
}

export async function applyLoyaltyRedeem(customerId, pointsToDeduct, appointmentId) {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    if (customer.points < pointsToDeduct) throw new Error('Insufficient points');

    customer.points -= pointsToDeduct;
    await customer.save();

    const loyaltyTransaction = new LoyaltyTransaction({
        customer: customer._id,
        appointmentId,
        points: -pointsToDeduct,
        type: 'redeem',
    });
    await loyaltyTransaction.save();
}

export async function getBalance(customerId) {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    return customer.points;
}

export function pointsToDiscount(points) {
    return Math.floor(points / 100) * 10;
}