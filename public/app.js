const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const toast = document.getElementById('toast');

// Persistent per-device identifier (no login/auth needed). Generated once
// and stored in localStorage, so the same browser/device always maps back
// to the same chat session and order history on the backend.
function getDeviceId() {
  let id = localStorage.getItem('restaurantChatDeviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('restaurantChatDeviceId', id);
  }
  return id;
}

const deviceId = getDeviceId();

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.sender}`;
  div.textContent = msg.text;

  if (msg.link) {
    const a = document.createElement('a');
    a.href = msg.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'pay-link';
    a.textContent = '💳 Pay with Paystack';
    div.appendChild(document.createElement('br'));
    div.appendChild(a);
  }

  chatMessages.appendChild(div);
}

function renderMessages(messages) {
  messages.forEach(renderMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Switch the on-screen keyboard to match whatever the bot just asked
  // for (plain numbers, an email address, or a free-form date/time).
  const lastWithHint = [...messages].reverse().find((m) => m.hint);
  if (lastWithHint) applyInputHint(lastWithHint.hint);
}

function applyInputHint(hint) {
  if (hint === 'email') {
    chatInput.type = 'email';
    chatInput.setAttribute('inputmode', 'email');
    chatInput.placeholder = 'you@example.com';
  } else if (hint === 'text') {
    chatInput.type = 'text';
    chatInput.setAttribute('inputmode', 'text');
    chatInput.placeholder = 'YYYY-MM-DD HH:MM';
  } else {
    chatInput.type = 'text';
    chatInput.setAttribute('inputmode', 'numeric');
    chatInput.placeholder = 'Type an option number...';
  }
}

function showToast(text, kind) {
  if (!toast) return;
  toast.textContent = text;
  toast.className = `toast ${kind} show`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 5000);
}

// If we just got redirected back from Paystack, show a small banner.
// The actual chat message confirming success/failure is already stored
// server-side and will show up via loadHistory() below.
function handlePaymentRedirect() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('payment');
  if (status === 'success') {
    showToast('✅ Payment successful!', 'success');
  } else if (status === 'failed') {
    showToast('❌ Payment failed. Please try again.', 'error');
  } else if (status === 'error') {
    showToast('⚠️ Could not confirm payment status.', 'error');
  }
  if (status) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function loadHistory() {
  const res = await fetch(`/api/history?deviceId=${encodeURIComponent(deviceId)}`);
  const data = await res.json();
  renderMessages(data.messages);
}

async function sendMessage(text) {
  const res = await fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, text }),
  });
  const data = await res.json();
  renderMessages(data.messages);
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  renderMessage({ sender: 'user', text });
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
  sendMessage(text);
});

handlePaymentRedirect();
loadHistory();