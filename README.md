# Restaurant ChatBot 🍽️

A number-driven chat interface for placing restaurant orders, with Paystack
payment integration and optional order scheduling. No login/authentication —
each browser/device is identified by a random ID stored in `localStorage`, so
each visitor keeps their own cart and order history.

## Features

- Chat-style ordering interface, driven entirely by numeric menu selections
- Menu items with multiple option groups (e.g. Size, Protein, Spice Level)
- Per-device session (no auth) — cart, order history, and email persist per browser
- `1` — browse the menu and add items (with options + quantity) to the current order
- `99` — checkout: place the order (or "No order to place" if the cart is empty),
  optionally schedule it for later, then choose to pay now (Paystack) or later
- `98` — view full order history (paid and unpaid)
- `97` — view the current (in-progress) order
- `0` — cancel the current in-progress order
- Paystack Checkout integration (test mode) with a redirect back into the chat
  and an automatic "payment successful/failed" notification
- Basic input validation everywhere (menu numbers, quantities, email, dates)

## Project structure

```
restaurant-chatbot/
├── server.js               # Thin entry point: wires up Express + routes
├── config.js                # Environment variables (PORT, BASE_URL, Paystack key)
├── package.json
├── .env.example              # Copy to .env and fill in your values
├── data/
│   └── menu.js               # Menu items + their option groups (size, protein, etc.)
├── store/
│   └── sessionStore.js       # In-memory per-device sessions + message log helpers
├── utils/
│   ├── format.js             # Turns cart/order data into the bot's text replies
│   └── validate.js           # Email / date / quantity validation helpers
├── services/
│   └── paystack.js           # All Paystack REST API calls (init + verify)
├── bot/
│   └── conversation.js       # The state machine driving the whole chat flow
├── routes/
│   ├── chatRoutes.js         # GET /api/history, POST /api/message
│   └── paymentRoutes.js      # GET /api/payment/callback
└── public/
    ├── index.html            # Chat UI shell
    ├── style.css              # Chat styling
    └── app.js                 # Frontend chat logic + device ID handling
```

Each module has one job: `data/` is just facts about the menu, `store/` only
knows how to persist and log messages, `utils/` is pure text/validation
functions with no side effects, `services/paystack.js` is the only file that
talks to Paystack, `bot/conversation.js` is the only file that contains the
state machine, and `routes/` just wires HTTP requests to that state machine.
`server.js` itself is now ~15 lines.

## Requirements

- Node.js 18 or newer (uses the built-in `fetch` API)
- A free [Paystack](https://paystack.com) account for a **test** secret key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your `.env` file from the example and fill in your Paystack test key:

   ```bash
   cp .env.example .env
   ```

   ```env
   PORT=3000
   BASE_URL=http://localhost:3000
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Get your test secret key from the Paystack dashboard under
   **Settings → API Keys & Webhooks**.

3. Run the app:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

## Testing a payment (Paystack test mode)

When you select **1 - Pay with Paystack**, you'll get a payment link. Paystack's
test cards (use any future expiry date and any CVV/OTP prompt):

| Card number         | Outcome |
|----------------------|---------|
| 4084 0840 8408 4081  | Successful payment |
| 5060 6666 6666 6666 6666 | Successful payment |
| 4084 0840 8408 4084  | Declined / insufficient funds |

Full list of test cards: https://paystack.com/docs/payments/test-payments

After paying, Paystack redirects back to `/api/payment/callback`, which verifies
the transaction with the Paystack API and then redirects to the chat with a
`?payment=success` or `?payment=failed` flag. The bot also posts a message
directly into the chat log confirming the outcome.

## Scheduling orders (optional)

During checkout (`99`), the bot asks if you'd like to schedule the order.
Enter a future date/time as `YYYY-MM-DD HH:MM` (24-hour clock), e.g.
`2026-07-10 18:30`, or `0` to place the order immediately instead.

## Notes on data storage

Sessions, carts, and order history are kept **in memory** on the server for
simplicity — they reset if the server restarts. For production use, swap the
`sessions` object in `server.js` for a real database (e.g. SQLite, Postgres,
Redis) keyed by the same `deviceId`.

## Deployment

Any Node-friendly host works (Render, Railway, Fly.io, Heroku, etc.). Example
using [Render](https://render.com):

1. Push this project to a GitHub repository (see below).
2. On Render, create a new **Web Service** from that repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add environment variables in Render's dashboard:
   - `PAYSTACK_SECRET_KEY` = your Paystack secret key (test or live)
   - `BASE_URL` = the URL Render gives your service, e.g. `https://your-app.onrender.com`
5. Deploy. Once live, visit the Render URL — the chatbot and Paystack redirect
   flow will both use `BASE_URL` automatically.

## Publishing to GitHub

From inside the `restaurant-chatbot` folder:

```bash
git init
git add .
git commit -m "Initial commit: restaurant chatbot with Paystack payments"
git branch -M main
git remote add origin https://github.com/<your-username>/restaurant-chatbot.git
git push -u origin main
```

(Create the empty repository first at https://github.com/new, then run the
commands above.)
