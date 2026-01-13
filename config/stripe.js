// Stripe configuration - only initialize if API key is provided
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe configured successfully');
} else {
  console.log('⚠️  Stripe not configured - using cash-only payments');
}

module.exports = stripe;
