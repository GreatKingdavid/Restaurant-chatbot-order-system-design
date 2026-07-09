// Entry point: wires up Express, static file serving, and the two route
// modules. All actual logic lives in bot/, store/, services/, and routes/.

const express = require('express');
const path = require('path');
const { PORT } = require('./config');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', chatRoutes);
app.use('/api', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Restaurant chatbot listening on http://localhost:${PORT}`);
});
