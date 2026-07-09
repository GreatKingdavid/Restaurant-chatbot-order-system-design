// The conversation state machine: given a session and the raw text the
// customer sent, decide what happens next. This file knows nothing about
// HTTP - it just mutates the session and appends bot replies.

const crypto = require('crypto');
const MENU = require('../data/menu');
const { bot, user } = require('../store/sessionStore');
const {
  cartTotal,
  mainMenuText,
  menuListText,
  optionGroupText,
  quantityPromptText,
  lineItemText,
  currentOrderText,
  orderBlockText,
  historyText,
} = require('../utils/format');
const { isValidEmail, parseFutureDate, isPositiveInteger } = require('../utils/validate');
const { initializePaystackPayment } = require('../services/paystack');

function sendMainMenu(session) {
  session.state = 'MAIN';
  bot(session, mainMenuText());
}

function sendOrderingMenu(session) {
  session.state = 'ORDERING';
  session.currentSelection = null;
  bot(session, menuListText());
}

function presentCurrentOptionGroup(session) {
  const sel = session.currentSelection;
  const group = sel.meal.optionGroups[sel.groupIndex];
  bot(session, optionGroupText(sel.meal, group));
}

// Called once a customer confirms checkout (99) and either skips or
// completes scheduling. Moves the cart into a finalized order.
function finalizeOrder(session, scheduledFor) {
  const order = {
    id: session.orderCounter++,
    date: new Date().toLocaleString(),
    items: session.cart.map((i) => ({ ...i })),
    total: cartTotal(session.cart),
    scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
    status: 'unpaid',
    reference: null,
    authorizationUrl: null,
  };
  session.orders.push(order);
  session.cart = [];
  session.lastOrder = order;

  bot(session, `✅ Order placed!\n\n${orderBlockText(order)}`);

  if (!session.email) {
    session.state = 'EMAIL_INPUT';
    bot(session, 'Please enter your email address so we can send your payment receipt:');
  } else {
    session.state = 'PAY_CHOICE';
    bot(session, 'Would you like to pay now?\n1 - Pay with Paystack\n0 - Pay later');
  }
}

async function handleMessage(session, rawText) {
  const input = (rawText || '').trim();
  user(session, input);

  // ---- MAIN MENU -----------------------------------------------------
  if (session.state === 'MAIN') {
    switch (input) {
      case '1':
        sendOrderingMenu(session);
        return;

      case '99':
        if (session.cart.length === 0) {
          bot(session, 'No order to place.');
          bot(session, 'Select 1 to place a new order.');
          sendMainMenu(session);
        } else {
          session.state = 'SCHEDULE_CHOICE';
          bot(session, 'Would you like to schedule this order for later?\n1 - Yes, schedule it\n0 - No, place it now');
        }
        return;

      case '98':
        bot(session, historyText(session.orders));
        sendMainMenu(session);
        return;

      case '97':
        bot(session, currentOrderText(session.cart));
        sendMainMenu(session);
        return;

      case '0':
        if (session.cart.length === 0) {
          bot(session, 'There is no active order to cancel.');
        } else {
          session.cart = [];
          bot(session, 'Your current order has been cancelled.');
        }
        sendMainMenu(session);
        return;

      default:
        bot(session, "Sorry, I didn't understand that. Please select a valid option number.");
        sendMainMenu(session);
        return;
    }
  }

  // ---- BROWSING THE MENU ----------------------------------------------
  if (session.state === 'ORDERING') {
    if (input === '0') {
      bot(session, 'Okay, back to the main menu.');
      sendMainMenu(session);
      return;
    }
    if (!/^\d+$/.test(input)) {
      bot(session, "That's not a valid meal number. Please try again.");
      sendOrderingMenu(session);
      return;
    }
    const meal = MENU.find((m) => m.id === parseInt(input, 10));
    if (!meal) {
      bot(session, "That's not a valid meal number. Please try again.");
      sendOrderingMenu(session);
      return;
    }
    session.currentSelection = { meal, groupIndex: 0, chosen: [], unitPrice: meal.basePrice };
    if (meal.optionGroups.length === 0) {
      session.state = 'QUANTITY';
      bot(session, quantityPromptText(meal));
    } else {
      session.state = 'OPTION_SELECT';
      presentCurrentOptionGroup(session);
    }
    return;
  }

  // ---- CHOOSING OPTIONS FOR THE SELECTED ITEM ---------------------------
  if (session.state === 'OPTION_SELECT') {
    const sel = session.currentSelection;
    if (input === '0') {
      bot(session, 'Okay, cancelled that item.');
      sendOrderingMenu(session);
      return;
    }
    if (!/^\d+$/.test(input)) {
      bot(session, "That's not a valid option number. Please try again.");
      presentCurrentOptionGroup(session);
      return;
    }
    const group = sel.meal.optionGroups[sel.groupIndex];
    const choiceIdx = parseInt(input, 10) - 1;
    const choice = group.choices[choiceIdx];
    if (!choice) {
      bot(session, "That's not a valid option number. Please try again.");
      presentCurrentOptionGroup(session);
      return;
    }
    sel.chosen.push({ group: group.name, label: choice.label, delta: choice.delta });
    sel.unitPrice += choice.delta;
    sel.groupIndex += 1;

    if (sel.groupIndex < sel.meal.optionGroups.length) {
      presentCurrentOptionGroup(session);
    } else {
      session.state = 'QUANTITY';
      bot(session, quantityPromptText(sel.meal));
    }
    return;
  }

  // ---- QUANTITY ---------------------------------------------------------
  if (session.state === 'QUANTITY') {
    const sel = session.currentSelection;
    if (input === '0') {
      bot(session, 'Okay, cancelled that item.');
      sendOrderingMenu(session);
      return;
    }
    if (!isPositiveInteger(input)) {
      bot(session, 'Please enter a valid quantity (a whole number greater than 0), or 0 to cancel.');
      return;
    }
    const qty = parseInt(input, 10);
    const cartItem = {
      cartItemId: crypto.randomUUID(),
      name: sel.meal.name,
      unitPrice: sel.unitPrice,
      qty,
      options: sel.chosen,
      lineTotal: sel.unitPrice * qty,
    };
    session.cart.push(cartItem);
    bot(session, `Added: ${lineItemText(cartItem)}`);
    session.currentSelection = null;
    sendOrderingMenu(session);
    return;
  }

  // ---- OPTIONAL SCHEDULING ----------------------------------------------
  if (session.state === 'SCHEDULE_CHOICE') {
    if (input === '1') {
      session.state = 'SCHEDULE_INPUT';
      bot(session, 'Please enter the date & time as YYYY-MM-DD HH:MM (24-hour), e.g. 2026-07-10 18:30.\nOr type 0 to place the order now instead.');
      return;
    }
    if (input === '0') {
      finalizeOrder(session, null);
      return;
    }
    bot(session, 'Please select 1 to schedule, or 0 to place the order now.');
    return;
  }

  if (session.state === 'SCHEDULE_INPUT') {
    if (input === '0') {
      finalizeOrder(session, null);
      return;
    }
    const date = parseFutureDate(input);
    if (!date) {
      bot(session, 'That date/time is invalid or in the past. Please use YYYY-MM-DD HH:MM (24-hour), e.g. 2026-07-10 18:30, or type 0 to place the order now.');
      return;
    }
    finalizeOrder(session, date);
    return;
  }

  // ---- EMAIL FOR PAYMENT RECEIPT ----------------------------------------
  if (session.state === 'EMAIL_INPUT') {
    if (!isValidEmail(input)) {
      bot(session, "That doesn't look like a valid email address. Please try again.");
      return;
    }
    session.email = input;
    session.state = 'PAY_CHOICE';
    bot(session, 'Would you like to pay now?\n1 - Pay with Paystack\n0 - Pay later');
    return;
  }

  // ---- PAY NOW OR LATER ---------------------------------------------------
  if (session.state === 'PAY_CHOICE') {
    if (input === '0') {
      bot(session, 'No problem, you can settle payment later.');
      sendMainMenu(session);
      return;
    }
    if (input === '1') {
      try {
        const url = await initializePaystackPayment(session, session.lastOrder);
        bot(session, `Please complete your payment using the link below. You'll be redirected back here once payment is done.`, url);
      } catch (err) {
        bot(session, `Sorry, payment couldn't be started: ${err.message}`);
      }
      sendMainMenu(session);
      return;
    }
    bot(session, 'Please select 1 to pay now, or 0 to pay later.');
    return;
  }

  // Fallback safety net
  bot(session, "Something went wrong, let's start over.");
  sendMainMenu(session);
}

module.exports = { handleMessage, sendMainMenu };
