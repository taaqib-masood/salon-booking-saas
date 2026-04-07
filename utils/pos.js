import { Client } from 'square';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});

export async function createSquarePayment(amount, currency, terminalId, referenceId) {
  try {
    const response = await client.terminalCheckoutsApi.createTerminalCheckout({
      idempotencyKey: referenceId,
      checkout: {
        amount_money: {
          amount,
          currency,
        },
        device_options: {
          device_id: terminalId,
        },
      },
    });
    return response.result;
  } catch (error) {
    console.log(`Error creating Square payment: ${error}`);
    throw error;
  }
}

export async function cancelSquarePayment(checkoutId) {
  try {
    const response = await client.terminalCheckoutsApi.cancelTerminalCheckout(checkoutId);
    return response.result;
  } catch (error) {
    console.log(`Error cancelling Square payment: ${error}`);
    throw error;
  }
}

export async function getSquarePaymentStatus(checkoutId) {
  try {
    const response = await client.terminalCheckoutsApi.getTerminalCheckout(checkoutId);
    return {
      status: response.result.status,
      receiptUrl: response.result.payment ? response.result.payment.receipt_url : null,
    };
  } catch (error) {
    console.log(`Error getting Square payment status: ${error}`);
    throw error;
  }
}