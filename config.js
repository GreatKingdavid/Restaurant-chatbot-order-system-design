// Central place for all environment-driven configuration.
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  // Public URL of this app - used to build Paystack's callback_url.
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
};
