/* Demo UI: chat bubbles + clean text display */

const el = (id) => document.getElementById(id);

const chatEl = el('chat');
const inputEl = el('scammerInput');
const sendBtn = el('sendBtn');
const resetBtn = el('resetBtn');
const sampleBtn = el('sampleBtn');
const intelEl = el('intel');

let sessionId = `demo-${Date.now()}`;
let conversationHistory = [];

const nowIso = () => new Date().toISOString();

const sanitizeDisplayText = (text) => {
  const raw = String(text || '');
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^#+\s+/gm, '')
    .trim();
};

const scrollToBottom = () => {
  chatEl.scrollTop = chatEl.scrollHeight;
};

const addMessage = (role, text) => {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = role === 'scammer' ? 'SCAMMER' : 'HONEYPOT';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = sanitizeDisplayText(text);

  msg.appendChild(meta);
  msg.appendChild(bubble);
  chatEl.appendChild(msg);
  scrollToBottom();
};

const setLoading = (loading) => {
  if (loading) {
    sendBtn.disabled = true;
    sendBtn.classList.add('loading');
    sendBtn.querySelector('.btnText').textContent = 'Sending';
  } else {
    sendBtn.disabled = false;
    sendBtn.classList.remove('loading');
    sendBtn.querySelector('.btnText').textContent = 'Send';
  }
};

const renderIntel = (agentFullResponse) => {
  if (!agentFullResponse || typeof agentFullResponse !== 'object') return;
  const payload = {
    scamDetected: !!agentFullResponse.scamDetected,
    phase: agentFullResponse.phase || '',
    intelSignals: agentFullResponse.intelSignals || {},
    agentNotes: agentFullResponse.agentNotes || ''
  };
  intelEl.textContent = JSON.stringify(payload, null, 2);
};

const sendScammerMessage = async (text) => {
  const body = {
    sessionId,
    message: { text, sender: 'scammer', timestamp: nowIso() },
    conversationHistory,
    metadata: { ui: 'demo' }
  };

  const res = await fetch('/demo/api/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  return res.json();
};

const onSend = async () => {
  const scammerText = sanitizeDisplayText(inputEl.value);
  if (!scammerText) return;

  addMessage('scammer', scammerText);
  inputEl.value = '';

  // Add scammer message to history (as prior context for next turn).
  conversationHistory.push({ text: scammerText, sender: 'scammer', timestamp: nowIso() });

  setLoading(true);
  try {
    const data = await sendScammerMessage(scammerText);
    const reply = (data && data.reply) ? String(data.reply) : '';
    const full = data && data.full ? data.full : null;

    if (reply) {
      addMessage('honeypot', reply);
      conversationHistory.push({ text: reply, sender: 'user', timestamp: nowIso() });
    }

    renderIntel(full);
  } catch (err) {
    addMessage('honeypot', 'Sorry sir, something is not working on my side. Which callback number should I use?');
    renderIntel({ scamDetected: true, phase: 'VERIFICATION', intelSignals: {}, agentNotes: String(err && err.message ? err.message : err) });
  } finally {
    setLoading(false);
  }
};

const resetAll = () => {
  sessionId = `demo-${Date.now()}`;
  conversationHistory = [];
  chatEl.innerHTML = '';
  intelEl.textContent = '';
  inputEl.value = '';
  inputEl.focus();
};

const runSample = async () => {
  resetAll();
  const script = [
    'URGENT: Your SBI account has been compromised. It will be blocked in 2 hours. Share OTP now.',
    'Call our line at +91-9876543210 and share the OTP immediately.',
    'Reference ID is REF123456. This is Fraud Prevention Department.',
    'Pay Rs. 2,500 to refund/secure. UPI is scam.pay@oksbi and open http://secure-sbi-verify.com'
  ];

  for (const line of script) {
    inputEl.value = line;
    // eslint-disable-next-line no-await-in-loop
    await onSend();
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, 350));
  }
};

sendBtn.addEventListener('click', onSend);
resetBtn.addEventListener('click', resetAll);
sampleBtn.addEventListener('click', runSample);

inputEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSend();
});

// Initial placeholder message for the demo.
addMessage('honeypot', "Sir, I am here. Send me the scam message and I'll reply like a real person.");
inputEl.focus();

