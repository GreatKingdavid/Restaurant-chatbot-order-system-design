const express = require('express');
const router = express.Router();

const { BASE_URL } = require('../config');
const { sessions, referenceIndex, bot } = require('../store/sessionStore');
const { verifyPaystackPayment } = require('../services/paystack');
const { sendMainMenu } = require('../bot/conversation');

// Paystack redirects the customer's browser here after a payment attempt.
router.get('/payment/callback', async (req, res) => {
  const { reference, deviceId } = req.query;
  if (!reference) return res.status(400).send('Missing payment reference.');

  const targetDeviceId = deviceId || referenceIndex[reference];
  const session = targetDeviceId ? sessions[targetDeviceId] : null;

  try {
    const success = await verifyPaystackPayment(reference);

    if (session) {
      const order = session.orders.find((o) => o.reference === reference);
      if (success && order) {
        order.status = 'paid';
        bot(session, `✅ Payment successful! Order #${order.id} is now paid. Thank you!`);
        sendMainMenu(session);
      } else if (!success) {
        bot(session, '❌ Payment was not successful. You can try paying again from the main menu.');
        sendMainMenu(session);
      }
    }

    return res.redirect(`${BASE_URL}/?payment=${success ? 'success' : 'failed'}`);
  } catch (err) {
    console.error('Payment verification error:', err);
    if (session) {
      bot(session, '⚠️ We could not confirm your payment status. Please contact support if you were charged.');
      sendMainMenu(session);
    }
    return res.redirect(`${BASE_URL}/?payment=error`);
  }
});

module.exports = router;
