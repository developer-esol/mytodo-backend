// config/stripe.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createEscrowPaymentIntent = async (amount, currency, metadata = {}) => {
    if (amount < 50){
    amount = amount + 5;
  }else{
    amount = amount * 105 / 100; // Add 5% to cover Stripe fees
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      capture_method: "manual", // Critical for escrow
      payment_method_types: ["card"],
    });
    return paymentIntent;
  } catch (error) {
    console.error("Stripe escrow payment intent error:", error);
    throw error;
  }
};

const captureEscrowPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Stripe escrow capture error:", error);
    throw error;
  }
};

const cancelEscrowPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Stripe escrow cancellation error:", error);
    throw error;
  }
};

module.exports = {
  createEscrowPaymentIntent,
  captureEscrowPayment,
  cancelEscrowPayment,
  stripe,
};
