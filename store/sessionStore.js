// In-memory "database": one session per device.
//
// sessions[deviceId] = {
//   deviceId,
//   state: 'MAIN' | 'ORDERING' | 'OPTION_SELECT' | 'QUANTITY' |
//          'SCHEDULE_CHOICE' | 'SCHEDULE_INPUT' | 'EMAIL_INPUT' | 'PAY_CHOICE',
//   cart: [{ cartItemId, name, unitPrice, qty, options: [{group,label,delta}], lineTotal }],
//   orders: [{ id, date, items, total, scheduledFor, status, reference, authorizationUrl }],
//   currentSelection: { meal, groupIndex, chosen: [], unitPrice } | null,
//   lastOrder: order awaiting a payment decision | null,
//   email: string | null,
//   messages: [{ sender: 'bot'|'user', text, link? }]
// }
const sessions = {};

// Maps a Paystack payment reference back to a deviceId, so the payment
// callback (which Paystack calls with only ?reference=...) can still find
// the right session even if the deviceId query param is ever lost.
const referenceIndex = {};

function newSession(deviceId) {
  return {
    deviceId,
    state: 'MAIN',
    cart: [],
    orders: [],
    currentSelection: null,
    lastOrder: null,
    email: null,
    messages: [],
    orderCounter: 1,
  };
}

function getSession(deviceId) {
  if (!sessions[deviceId]) {
    sessions[deviceId] = newSession(deviceId);
  }
  return sessions[deviceId];
}

function bot(session, text, link) {
  const msg = { sender: 'bot', text };
  if (link) msg.link = link;
  session.messages.push(msg);
}

function user(session, text) {
  session.messages.push({ sender: 'user', text });
}

module.exports = { sessions, referenceIndex, getSession, bot, user };
