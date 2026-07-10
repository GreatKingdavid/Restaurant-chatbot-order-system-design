// Everything that turns cart/order data into the text the bot actually
// sends. Kept separate from the state machine so message copy can change
// without touching conversation logic, and vice versa.

const MENU = require('../data/menu');

function money(n) {
  return `₦${n.toFixed(2)}`;
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.lineTotal, 0);
}

function mainMenuText() {
  return (
    'What would you like to do?\n' +
    '1  - Place an order\n' +
    '99 - Checkout order\n' +
    '98 - See order history\n' +
    '97 - See current order\n' +
    '0  - Cancel order'
  );
}

function menuListText() {
  const lines = MENU.map((m) => `${m.id}. ${m.name} - from ${money(m.basePrice)}`);
  return 'Please select a meal by number:\n' + lines.join('\n') + '\n\n0 - Back to main menu';
}

function optionGroupText(meal, group) {
  const lines = group.choices.map(
    (c, idx) => `${idx + 1}. ${c.label}${c.delta ? ` (+${money(c.delta)})` : ''}`
  );
  return `${meal.name} - please choose ${group.name}:\n` + lines.join('\n') + '\n\n0 - Cancel this item';
}

function quantityPromptText(meal) {
  return `How many "${meal.name}" would you like? (enter a number, or 0 to cancel)`;
}

function lineItemText(item) {
  const optsText = item.options.length ? ` (${item.options.map((o) => o.label).join(', ')})` : '';
  return `${item.qty} x ${item.name}${optsText} - ${money(item.lineTotal)}`;
}

function currentOrderText(cart) {
  if (cart.length === 0) {
    return "You don't have any items in your current order yet. Select 1 to start ordering.";
  }
  const lines = cart.map(lineItemText);
  return 'Your current order:\n' + lines.join('\n') + `\n\nSubtotal: ${money(cartTotal(cart))}`;
}

function orderBlockText(order) {
  const lines = order.items.map(lineItemText).join('\n');
  const statusLabel = order.status === 'paid' ? 'Paid ✅' : 'Unpaid ⏳';
  const scheduleLine = order.scheduledFor
    ? `\nScheduled for: ${new Date(order.scheduledFor).toLocaleString()}`
    : '';
  return `Order #${order.id} (${order.date}) - ${statusLabel}\n${lines}\nTotal: ${money(order.total)}${scheduleLine}`;
}

function historyText(orders) {
  if (orders.length === 0) {
    return "You don't have any placed orders yet.";
  }
  return 'Your order history:\n\n' + orders.map(orderBlockText).join('\n\n');
}

module.exports = {
  money,
  cartTotal,
  mainMenuText,
  menuListText,
  optionGroupText,
  quantityPromptText,
  lineItemText,
  currentOrderText,
  orderBlockText,
  historyText,
};
