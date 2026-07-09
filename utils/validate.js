// Small, focused input-validation helpers used by the conversation state
// machine. Kept separate so they're easy to unit test on their own.

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

// Accepts "YYYY-MM-DD HH:MM" (or with a "T" separator) and requires the
// date to be in the future. Returns a Date, or null if invalid/past.
function parseFutureDate(str) {
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/.exec(str.trim());
  if (!match) return null;
  const date = new Date(`${match[1]}T${match[2]}:00`);
  if (isNaN(date.getTime())) return null;
  if (date.getTime() <= Date.now()) return null;
  return date;
}

function isPositiveInteger(str) {
  return /^\d+$/.test(str) && parseInt(str, 10) > 0;
}

module.exports = { isValidEmail, parseFutureDate, isPositiveInteger };
