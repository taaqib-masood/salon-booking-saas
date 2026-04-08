export function calculateVAT(price, rate = 0.05) {
    const subtotal = price;
    const vatAmount = price * rate;
    const totalAmount = price + vatAmount;
    return {subtotal, vatAmount, totalAmount};
}

export function extractVAT(vatInclusivePrice, rate = 0.05) {
    const subtotal = vatInclusivePrice / (1 + rate);
    const vatAmount = vatInclusivePrice - subtotal;
    const totalAmount = vatInclusivePrice;
    return {subtotal, vatAmount, totalAmount};
}

export function formatAED(amount) {
    return `AED ${amount.toFixed(2)}`;
}