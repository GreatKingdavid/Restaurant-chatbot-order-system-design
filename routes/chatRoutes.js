const express = require('express');
const router = express.Router();

const { getSession, bot, sessions } = require('../store/sessionStore');
const { handleMessage, sendMainMenu } = require('../bot/conversation');

// Start / re-fetch a session's conversation. Creates the session (and sends
// the welcome message + main menu) the first time a device is seen.
router.get('/history', (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });

  const isNew = !sessions[deviceId];
  const session = getSession(deviceId);

  if (isNew) {
    bot(session, 'Welcome to our restaurant! I can help you place and manage your order.');
    sendMainMenu(session);
  }

  res.json({ messages: session.messages });
});

// Send a message (i.e. a menu option) and get the bot's reply.
router.post('/message', async (req, res) => {
  const { deviceId, text } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
  if (typeof text !== 'string') return res.status(400).json({ error: 'text must be a string' });

  const session = getSession(deviceId);
  const before = session.messages.length;
  await handleMessage(session, text);
  // Skip index `before` itself: that's the user's own message, which the
  // frontend already rendered locally before calling this endpoint.
  const newMessages = session.messages.slice(before + 1);

  res.json({ messages: newMessages });
});

module.exports = router;
