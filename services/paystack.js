// All communication with Paystack's REST API lives here. Nothing else in
// the app needs to know the request/response shape of their endpoints.

const { PAYSTACK_SECRET_KEY, BASE_URL } = require('../config');
const { referenceIndex } = require('../store/sessionStore');

async function initializePaystackPayment(session, order) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Payments are not configured on this server yet.');
  }
  const reference = `order_${order.id}_${Date.now()}`;
  const callbackUrl = `${BASE_URL}/api/payment/callback?deviceId=${encodeURIComponent(session.deviceId)}`;

  const resp = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: session.email,
      amount: Math.round(order.total * 100), // Paystack expects amount in kobo
      reference,
      callback_url: callbackUrl,
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.status) {
    throw new Error((data && data.message) || 'Could not start payment.');
  }

  order.reference = reference;
  order.authorizationUrl = data.data.authorization_url;
  referenceIndex[reference] = session.deviceId;
  return data.data.authorization_url;
}

async function verifyPaystackPayment(reference) {
  const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const data = await resp.json();
  return Boolean(data && data.status && data.data && data.data.status === 'success');
}

module.exports = { initializePaystackPayment, verifyPaystackPayment };
