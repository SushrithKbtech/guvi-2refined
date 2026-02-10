/**
 * Honeypot Agent - refined for human-sounding extraction
 */

const { OpenAI } = require('openai');

const UPI_SUFFIXES = [
  'okicici', 'oksbi', 'okhdfcbank', 'okaxis', 'okpnb', 'paytm', 'ybl', 'ibl', 'upi', 'axl', 'apl',
  'freecharge', 'fbl', 'sbi', 'hdfcbank', 'icici', 'barodampay', 'mahb', 'kotak', 'indus', 'boi'
];
const UPI_SUFFIX_SET = new Set(UPI_SUFFIXES);

const SCHEMA_KEYS = [
  'bankAccounts',
  'accountLast4',
  'complaintIds',
  'employeeIds',
  'phoneNumbers',
  'callbackNumbers',
  'upiIds',
  'phishingLinks',
  'emailAddresses',
  'appNames',
  'transactionIds',
  'merchantNames',
  'amounts',
  'ifscCodes',
  'departmentNames',
  'designations',
  'supervisorNames',
  'scammerNames',
  'orgNames',
  'suspiciousKeywords'
];

const ReplyPolicy = {
  bannedPhrases: [
    /\bso i can\b/i,
    /so i can tell the bank properly/i,
    /so i can cross-check the sms/i,
    /so i can match it in my app/i,
    /\bwhat should i do\b/i,
    /\bwhat steps should i take\b/i,
    /\bwhat actions should i take\b/i,
    /\bhow can you help\b/i
  ],
  bannedQuestionIntents: [
    /\bwhat should i do\b/i,
    /\bwhat steps should i take\b/i,
    /\bwhat actions should i take\b/i,
    /\bhow can you help\b/i,
    /\bwhat do i do now\b/i,
    /\bwhat should i do first\b/i
  ],
  phraseBank: {
    openings: [
      'Sir, I am a bit worried about this',
      'Sir, this is making me uneasy',
      'Sir, I am getting tense about this',
      'Sir, I am a little confused and worried',
      'Sir, this is stressing me out a bit'
    ],
    excuses: [
      'My SMS is delayed on this phone',
      'My signal is patchy right now',
      'I am in the lift, network is weak',
      'My banking app is stuck for a minute',
      'Battery is low so the phone is slow',
      'I am outside and the network keeps dropping',
      'My dual SIM is acting up',
      'WhatsApp messages are mixed up'
    ],
    reasons: [
      'I do not want to type the wrong thing',
      'I am getting confused looking at the SMS',
      'I need it for my notes',
      'I might be mixing up the details',
      'Let me note it down properly',
      'My app is lagging a bit',
      'I want to be sure I am reading it right'
    ],
    questions: {
      callback: [
        'What number should I call you back on?',
        'Which number can I reach you on?',
        'What callback number should I use?'
      ],
      refId: [
        'What is the case or reference ID?',
        'What is the complaint or reference number?',
        'What ref ID is showing there?'
      ],
      name: [
        'What is your name, sir?',
        'Can you tell me your name?',
        'Who am I speaking with, sir?'
      ],
      department: [
        'Which department are you from, sir?',
        'What department is handling this?',
        'Which team is this from, sir?'
      ],
      designation: [
        'What is your designation there?',
        'What is your role there, sir?',
        'What is your position in the department?'
      ],
      employeeId: [
        'What is your employee ID?',
        'Can you share your employee ID?',
        'What staff ID should I note?'
      ],
      last4: [
        'Can you share just the last 4 digits you have?',
        'What are the last 4 digits you see there?',
        'Just the last four digits on your side?'
      ],
      upi: [
        'Which UPI ID is this related to?',
        'What UPI handle is showing there?',
        'Which UPI ID are you referring to?'
      ],
      link: [
        'What is the exact link you want me to open?',
        'Which website link are you asking me to use?',
        'What URL should I open?'
      ],
      app: [
        'What is the app name you want me to install?',
        'Which app should I download?',
        'What app are you asking me to use?'
      ],
      email: [
        'Which email should I write to?',
        'What email ID should I use?',
        'Which email address are you using for this?'
      ],
      txnId: [
        'What is the transaction ID showing?',
        'What is the txn ID on your side?',
        'Which transaction ID is this?'
      ],
      amount: [
        'What exact amount is showing?',
        'How much is the amount there?',
        'What amount is it showing on your side?'
      ],
      merchant: [
        'Which merchant name is shown?',
        'What merchant is it showing?',
        'Which shop or merchant is listed?'
      ],
      ifsc: [
        'What IFSC is it tagged to?',
        'Which IFSC code is it linked with?',
        'What IFSC code is showing?'
      ],
      branch: [
        'Which branch is this linked to?',
        'What branch address is shown there?',
        'Which branch is it mapped to?'
      ]
    }
  }
};

const INTENT_PATTERNS = [
  { intent: 'callback', regex: /\bcallback\b|\bcall back\b|reach you on|contact number|phone number|number should i call/i },
  { intent: 'refId', regex: /\bcase\b|\breference\b|\bref id\b|\bcomplaint\b|\bchallan\b|\btracking\b|\bawb\b|\bticket\b/i },
  { intent: 'name', regex: /\byour name\b|who am i speaking|who is this/i },
  { intent: 'department', regex: /\bdepartment\b|\bteam\b/i },
  { intent: 'designation', regex: /\bdesignation\b|\brole\b|\bposition\b/i },
  { intent: 'employeeId', regex: /\bemployee id\b|\bstaff id\b|\bemp id\b/i },
  { intent: 'last4', regex: /last\s*(4|four)|last\s*(four|4)\s*digits/i },
  { intent: 'upi', regex: /\bupi\b|\bupi id\b|\bupi handle\b/i },
  { intent: 'link', regex: /\blink\b|\burl\b|\bwebsite\b/i },
  { intent: 'app', regex: /\bapp\b|\bapk\b|\bdownload\b|\binstall\b/i },
  { intent: 'email', regex: /\bemail\b/i },
  { intent: 'txnId', regex: /\btransaction id\b|\btxn id\b|\butr\b|\brrn\b/i },
  { intent: 'amount', regex: /\bamount\b|how much|\brs\b|\binr\b/i },
  { intent: 'merchant', regex: /\bmerchant\b|\bshop\b|\bstore\b|\bvendor\b/i },
  { intent: 'ifsc', regex: /\bifsc\b/i },
  { intent: 'branch', regex: /\bbranch\b/i }
];

const unique = (arr) => [...new Set((arr || []).filter(Boolean))];

const normalizeWhitespace = (text) => String(text || '').replace(/\s+/g, ' ').trim();

const stripTrailingPunct = (text) => String(text || '').replace(/[.!?]+$/, '').trim();

const getRecentReplies = (history, count) => {
  return (history || [])
    .map(h => h && h.agentReply ? h.agentReply : '')
    .filter(Boolean)
    .slice(-count);
};

const pickNonRepeating = (variants, recentText, turnNumber) => {
  if (!variants || variants.length === 0) return '';
  const recentLower = String(recentText || '').toLowerCase();
  const unused = variants.filter(v => !recentLower.includes(String(v).toLowerCase()));
  const pool = unused.length > 0 ? unused : variants;
  return pool[turnNumber % pool.length];
};

const safeJsonParse = (text) => {
  if (!text || typeof text !== 'string') return null;
  const raw = text.trim();
  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  };
  let parsed = tryParse(raw);
  if (parsed) return parsed;

  const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeMatch) {
    parsed = tryParse(codeMatch[1].trim());
    if (parsed) return parsed;
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    parsed = tryParse(raw.slice(firstBrace, lastBrace + 1));
    if (parsed) return parsed;
  }
  return null;
};

const detectIntentFromReply = (reply) => {
  if (!reply) return '';
  const text = reply.toLowerCase();
  for (const item of INTENT_PATTERNS) {
    if (item.regex.test(text)) return item.intent;
  }
  return '';
};

const isExtractionQuestion = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return INTENT_PATTERNS.some(item => item.regex.test(lower));
};

const countQuestionMarks = (text) => (String(text || '').match(/\?/g) || []).length;

const countSentences = (text) => {
  return String(text || '')
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(Boolean).length;
};

const validateReply = (reply) => {
  if (!reply || typeof reply !== 'string') return { ok: false, reason: 'empty' };
  const text = normalizeWhitespace(reply);

  if (countQuestionMarks(text) !== 1) return { ok: false, reason: 'question-count' };
  if (countSentences(text) > 2) return { ok: false, reason: 'sentence-count' };

  if (!isExtractionQuestion(text)) return { ok: false, reason: 'not-extraction' };

  for (const re of ReplyPolicy.bannedPhrases) {
    if (re.test(text)) return { ok: false, reason: 'banned-phrase' };
  }
  for (const re of ReplyPolicy.bannedQuestionIntents) {
    if (re.test(text)) return { ok: false, reason: 'banned-question' };
  }

  if (/\b(otp|pin|password|cvv|upi pin|mpin)\b/i.test(text)) return { ok: false, reason: 'sensitive-ask' };
  if (/\baccount number\b/i.test(text) && !/last\s*(4|four)/i.test(text)) return { ok: false, reason: 'full-account' };

  return { ok: true };
};

const planIntent = ({ intel, scammerMessage, lastIntent, turnNumber }) => {
  const missing = (key) => !intel[key] || intel[key].length === 0;
  const text = String(scammerMessage || '').toLowerCase();

  const mentionsPayment = /\b(upi|payment|refund|transfer|collect|credited|debit|debited|fee|charge|amount|rs\.|inr|rupees)\b/i.test(text);
  const mentionsLink = /\b(link|website|url|click|download|install|apk|app)\b/i.test(text);
  const mentionsTxn = /\b(transaction|txn|utr|rrn|debited|credited)\b/i.test(text);
  const asksAccountNumber = /\b(account number|bank account|16[- ]?digit|full account)\b/i.test(text) || /\b\d{12,18}\b/.test(text);
  const mentionsBranch = /\b(branch|ifsc)\b/i.test(text);

  const candidates = [];
  if (missing('callbackNumbers')) candidates.push('callback');
  if (missing('complaintIds')) candidates.push('refId');
  if (missing('scammerNames')) candidates.push('name');
  if (missing('departmentNames')) candidates.push('department');
  if (!missing('departmentNames') && missing('designations')) candidates.push('designation');

  if (asksAccountNumber) candidates.push('last4');

  if (mentionsPayment && missing('upiIds')) candidates.push('upi');

  if (mentionsLink) {
    if (/\b(app|apk|install|download)\b/i.test(text)) candidates.push('app');
    candidates.push('link');
  }

  if (mentionsTxn) {
    const txnOptions = [];
    if (missing('amounts')) txnOptions.push('amount');
    if (missing('transactionIds')) txnOptions.push('txnId');
    if (missing('merchantNames')) txnOptions.push('merchant');
    if (txnOptions.length > 0) candidates.push(txnOptions[turnNumber % txnOptions.length]);
  }

  if (missing('employeeIds')) candidates.push('employeeId');
  if (missing('emailAddresses')) candidates.push('email');

  if ((mentionsBranch || turnNumber >= 6) && missing('ifscCodes')) candidates.push('ifsc');

  if (candidates.length === 0) candidates.push('callback');

  const choice = candidates.find(intent => intent !== lastIntent) || candidates[0];
  return choice;
};

const buildLocalReply = ({ intent, scammerMessage, recentText, turnNumber, otpPressure }) => {
  const opening = pickNonRepeating(ReplyPolicy.phraseBank.openings, recentText, turnNumber);
  const excuse = otpPressure ? pickNonRepeating(ReplyPolicy.phraseBank.excuses, recentText, turnNumber + 1) : '';
  const reason = pickNonRepeating(ReplyPolicy.phraseBank.reasons, recentText, turnNumber + 2);

  const questions = ReplyPolicy.phraseBank.questions[intent] || ReplyPolicy.phraseBank.questions.callback;
  const question = pickNonRepeating(questions, recentText, turnNumber + 3);

  const sentence1Parts = [];
  if (opening) sentence1Parts.push(stripTrailingPunct(opening));
  if (excuse) sentence1Parts.push(stripTrailingPunct(excuse));

  let sentence1 = '';
  if (sentence1Parts.length === 1) sentence1 = `${sentence1Parts[0]}.`;
  if (sentence1Parts.length >= 2) sentence1 = `${sentence1Parts[0]}, ${sentence1Parts[1]}.`;

  const reasonClause = reason ? stripTrailingPunct(reason) : '';
  const questionSentence = reasonClause ? `${reasonClause}, ${question}` : question;

  const reply = normalizeWhitespace(`${sentence1} ${questionSentence}`.trim());
  return reply;
};

const scanHistoryForIntel = (history, currentMsg) => {
  const scammerText = (history || []).map(h => h && h.scammerMessage ? h.scammerMessage : '').join(' ');
  const fullText = `${scammerText} ${currentMsg || ''}`.trim();

  const upiSuffixPattern = UPI_SUFFIXES.join('|');

  const extractPhoneNumbers = (text) => {
    const matches = [];
    const regex = /(?:^|[^\d])(?:\+91[\s-]?)?([6-9]\d{9})(?!\d)/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push(m[1]);
    }
    return unique(matches);
  };

  const extractEmails = (text) => {
    const emails = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g) || [];
    return unique(emails.map(v => v.toLowerCase()));
  };

  const extractUpiIds = (text) => {
    const matches = [];
    const upiRegex = new RegExp(`\\b([a-zA-Z0-9._-]{2,256})@(${upiSuffixPattern})(?![\\w.])`, 'gi');
    for (const m of text.matchAll(upiRegex)) {
      matches.push(`${m[1]}@${m[2]}`);
    }
    return unique(matches);
  };

  const extractIfscCodes = (text) => {
    const codes = text.match(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi) || [];
    return unique(codes.map(v => v.toUpperCase()));
  };

  const extractBankAccounts = (text) => {
    const results = [];
    const addDigits = (digits) => {
      if (!digits) return;
      if (digits.length < 9 || digits.length > 18) return;
      if (/^[6-9]\d{9}$/.test(digits)) return;
      results.push(digits);
    };

    const contextRegex = /\b(?:account|acc|acct|a\/c)\b[^0-9]{0,20}([0-9][0-9 -]{7,25}[0-9])/gi;
    for (const m of text.matchAll(contextRegex)) {
      const digits = String(m[1] || '').replace(/\D/g, '');
      addDigits(digits);
    }

    const formattedRegex = /\b(\d{2,4}(?:[ -]\d{2,4}){2,5})\b/g;
    for (const m of text.matchAll(formattedRegex)) {
      const digits = String(m[1] || '').replace(/\D/g, '');
      addDigits(digits);
    }

    return unique(results);
  };

  const extractAccountLast4 = (text) => {
    const results = [];
    const regex = /\b(?:last\s*(4|four)\s*(?:digits|nos|numbers)?\s*(?:are|is)?\s*[:\-]?\s*)(\d{4})\b/gi;
    for (const m of text.matchAll(regex)) {
      results.push(m[2]);
    }
    return unique(results);
  };

  const normalizeAmountToken = (numStr, unit) => {
    if (!numStr) return null;
    const cleaned = String(numStr).replace(/,/g, '');
    const value = Number.parseFloat(cleaned);
    if (!Number.isFinite(value)) return null;
    const unitLower = (unit || '').toLowerCase();
    let multiplier = 1;
    if (unitLower === 'k') multiplier = 1000;
    else if (unitLower === 'lac' || unitLower === 'lakh') multiplier = 100000;
    else if (unitLower === 'cr' || unitLower === 'crore') multiplier = 10000000;
    const amount = Math.round(value * multiplier);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return String(amount);
  };

  const extractAmounts = (text) => {
    const amountMap = new Map();
    const addAmount = (canonical, pretty) => {
      if (!canonical) return;
      if (!amountMap.has(canonical)) amountMap.set(canonical, pretty || canonical);
    };

    const currencyRegex = /\b(?:rs\.?|inr|rupees)\s*([0-9][0-9,]*(?:\.\d+)?)(?:\s*(k|lac|lakh|crore|cr))?\b/gi;
    for (const m of text.matchAll(currencyRegex)) {
      addAmount(normalizeAmountToken(m[1], m[2]), m[0].trim());
    }

    const suffixRegex = /\b([0-9]+(?:\.\d+)?)\s*(k|lac|lakh|crore|cr)\b/gi;
    for (const m of text.matchAll(suffixRegex)) {
      addAmount(normalizeAmountToken(m[1], m[2]), m[0].trim());
    }

    const contextualRegex = /\b(?:amount|fee|fine|penalty|bill|due|dues|charge|charges|payment|pay|total)\s*(?:is|of|:)?\s*([0-9][0-9,]*(?:\.\d+)?)(?:\s*(k|lac|lakh|crore|cr))?\b/gi;
    for (const m of text.matchAll(contextualRegex)) {
      addAmount(normalizeAmountToken(m[1], m[2]), m[0].trim());
    }

    return {
      amounts: Array.from(amountMap.keys()),
      amountsPretty: Array.from(amountMap.values())
    };
  };

  const extractComplaintIds = (text) => {
    const ids = [];
    const regex = /\b(case|ref(?:erence)?|complaint|tracking|awb|consignment|challan|ticket)\s*(?:id|no|number|#|:)?\s*([A-Z0-9][A-Z0-9-]{2,})\b/gi;
    for (const m of text.matchAll(regex)) {
      const token = String(m[2] || '').toUpperCase();
      const hasDigit = /\d/.test(token);
      const hasLetter = /[A-Z]/.test(token);
      const hasHyphen = /-/.test(token);
      const mixed = hasDigit && hasLetter;
      if (hasDigit || hasHyphen || (token.length >= 6 && mixed)) ids.push(token);
    }
    return unique(ids);
  };

  const extractTransactionIds = (text) => {
    const ids = [];
    const regex = /\b(?:transaction\s*id|txn\s*id|utr|rrn)\s*[:#-]?\s*([A-Z0-9-]{6,})\b/gi;
    for (const m of text.matchAll(regex)) {
      ids.push(String(m[1] || '').toUpperCase());
    }
    return unique(ids);
  };

  const extractUrls = (text) => {
    const urls = text.match(/\bhttps?:\/\/[^\s]+/gi) || [];
    const www = text.match(/\bwww\.[^\s]+/gi) || [];
    return unique([...urls, ...www]);
  };

  const { amounts, amountsPretty } = extractAmounts(fullText);

  return {
    phoneNumbers: extractPhoneNumbers(fullText),
    emailAddresses: extractEmails(fullText),
    upiIds: extractUpiIds(fullText),
    ifscCodes: extractIfscCodes(fullText),
    bankAccounts: extractBankAccounts(fullText),
    accountLast4: extractAccountLast4(fullText),
    complaintIds: extractComplaintIds(fullText),
    transactionIds: extractTransactionIds(fullText),
    amounts,
    amountsPretty,
    urls: extractUrls(fullText)
  };
};

const normalizePhoneNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.length > 10 && digits.startsWith('91') ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(normalized)) return null;
  return normalized;
};

const normalizeEmail = (value) => {
  const cleaned = String(value || '').trim().replace(/[.,;:]+$/, '').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleaned)) return null;
  return cleaned;
};

const normalizeUpiId = (value) => {
  const cleaned = String(value || '').trim().replace(/[.,;:]+$/, '').toLowerCase();
  const match = cleaned.match(/^([a-z0-9._-]{2,256})@([a-z0-9]{2,64})$/i);
  if (!match) return null;
  const suffix = match[2].toLowerCase();
  if (suffix.includes('.')) return null;
  if (!UPI_SUFFIX_SET.has(suffix)) return null;
  return `${match[1].toLowerCase()}@${suffix}`;
};

const normalizeIfsc = (value) => {
  const cleaned = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleaned)) return null;
  return cleaned;
};

const normalizeComplaintId = (value) => {
  const cleaned = String(value || '').trim().replace(/[.,;:]+$/, '').toUpperCase();
  if (!cleaned) return null;
  const hasDigit = /\d/.test(cleaned);
  const hasLetter = /[A-Z]/.test(cleaned);
  const hasHyphen = /-/.test(cleaned);
  const mixed = hasDigit && hasLetter;
  if (!(hasDigit || hasHyphen || (cleaned.length >= 6 && mixed))) return null;
  return cleaned;
};

const normalizeBankAccount = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length < 9 || digits.length > 18) return null;
  if (/^[6-9]\d{9}$/.test(digits)) return null;
  return digits;
};

const normalizeAmountValue = (value) => {
  const text = String(value || '').toLowerCase().replace(/,/g, '');
  const match = text.match(/([0-9]+(?:\.\d+)?)(?:\s*(k|lac|lakh|crore|cr))?/i);
  if (!match) return null;
  const numStr = match[1];
  const unit = (match[2] || '').toLowerCase();
  const amount = Number.parseFloat(numStr);
  if (!Number.isFinite(amount)) return null;
  let multiplier = 1;
  if (unit === 'k') multiplier = 1000;
  else if (unit === 'lac' || unit === 'lakh') multiplier = 100000;
  else if (unit === 'cr' || unit === 'crore') multiplier = 10000000;
  const normalized = Math.round(amount * multiplier);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return String(normalized);
};

const normalizeUrl = (value) => {
  const cleaned = String(value || '').trim().replace(/[),.;:]+$/, '');
  if (!/^https?:\/\//i.test(cleaned) && !/^www\./i.test(cleaned)) return null;
  return cleaned;
};

const normalizeList = (value, normalizer) => {
  if (!Array.isArray(value)) return [];
  return unique(value
    .map(v => (v === null || v === undefined) ? '' : String(v).trim())
    .map(v => normalizer ? normalizer(v) : v)
    .filter(Boolean));
};

const mergeIntelSignals = (...sources) => {
  const merged = {};
  for (const key of SCHEMA_KEYS) {
    merged[key] = unique(sources.flatMap(src => (src && Array.isArray(src[key])) ? src[key] : []));
  }
  return merged;
};

const normalizeIntelSignals = (intel) => {
  const safe = intel || {};
  const normalized = {
    bankAccounts: normalizeList(safe.bankAccounts, normalizeBankAccount),
    accountLast4: normalizeList(safe.accountLast4, v => String(v || '').replace(/\D/g, '').slice(-4)),
    complaintIds: normalizeList(safe.complaintIds, normalizeComplaintId),
    employeeIds: normalizeList(safe.employeeIds, v => String(v || '').trim()),
    phoneNumbers: normalizeList(safe.phoneNumbers, normalizePhoneNumber),
    callbackNumbers: normalizeList(safe.callbackNumbers, normalizePhoneNumber),
    upiIds: normalizeList(safe.upiIds, normalizeUpiId),
    phishingLinks: normalizeList(safe.phishingLinks, normalizeUrl),
    emailAddresses: normalizeList(safe.emailAddresses, normalizeEmail),
    appNames: normalizeList(safe.appNames, v => String(v || '').trim()),
    transactionIds: normalizeList(safe.transactionIds, v => String(v || '').trim()),
    merchantNames: normalizeList(safe.merchantNames, v => String(v || '').trim()),
    amounts: normalizeList(safe.amounts, normalizeAmountValue),
    ifscCodes: normalizeList(safe.ifscCodes, normalizeIfsc),
    departmentNames: normalizeList(safe.departmentNames, v => String(v || '').trim()),
    designations: normalizeList(safe.designations, v => String(v || '').trim()),
    supervisorNames: normalizeList(safe.supervisorNames, v => String(v || '').trim()),
    scammerNames: normalizeList(safe.scammerNames, v => String(v || '').trim()),
    orgNames: normalizeList(safe.orgNames, v => String(v || '').trim()),
    suspiciousKeywords: normalizeList(safe.suspiciousKeywords, v => String(v || '').trim().toLowerCase())
  };

  const last4FromAccounts = normalized.bankAccounts.map(v => v.slice(-4));
  normalized.accountLast4 = unique([...(normalized.accountLast4 || []), ...last4FromAccounts]);

  if (normalized.phoneNumbers.length > 0 && normalized.callbackNumbers.length === 0) {
    normalized.callbackNumbers = unique([...normalized.phoneNumbers]);
  }
  if (normalized.callbackNumbers.length > 0 && normalized.phoneNumbers.length === 0) {
    normalized.phoneNumbers = unique([...normalized.callbackNumbers]);
  }

  return normalized;
};

const extractEntitiesFromText = (text) => {
  const lower = String(text || '').toLowerCase();

  const orgMatchers = [
    { name: 'SBI', regex: /\bsbi\b|state bank of india/i },
    { name: 'HDFC', regex: /\bhdfc\b|hdfc bank/i },
    { name: 'ICICI', regex: /\bicici\b|icici bank/i },
    { name: 'Axis', regex: /\baxis\b|axis bank/i },
    { name: 'PNB', regex: /\bpnb\b|punjab national/i },
    { name: 'Bank of Baroda', regex: /bank of baroda|\bbob\b/i },
    { name: 'Canara', regex: /\bcanara\b/i },
    { name: 'Union Bank', regex: /union bank/i },
    { name: 'Kotak', regex: /\bkotak\b/i },
    { name: 'IndusInd', regex: /\bindusind\b/i },
    { name: 'Bank of India', regex: /bank of india|\bboi\b/i },
    { name: 'India Post', regex: /india post/i }
  ];

  const orgNames = orgMatchers.filter(m => m.regex.test(text)).map(m => m.name);

  const departmentNames = [];
  const deptRegex = /\b([A-Z][A-Za-z& ]{2,40}\sDepartment)\b/g;
  for (const m of text.matchAll(deptRegex)) {
    const cleaned = normalizeWhitespace(String(m[1] || '').replace(/^(this is|this|the|from)\s+/i, ''));
    if (cleaned) departmentNames.push(cleaned);
  }

  const designations = [];
  const designationRegex = /\b(manager|officer|executive|agent|representative|inspector|advisor|coordinator|supervisor)\b/gi;
  for (const m of text.matchAll(designationRegex)) {
    designations.push(m[1]);
  }

  const employeeIds = [];
  const employeeIdRegex = /\b(?:employee|emp|staff)\s*id\s*[:#-]?\s*([A-Z0-9-]{3,})\b/gi;
  for (const m of text.matchAll(employeeIdRegex)) {
    employeeIds.push(String(m[1] || '').toUpperCase());
  }

  const scammerNames = [];
  const nameRegex = /\b(?:my name is|this is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  for (const m of text.matchAll(nameRegex)) {
    const candidate = String(m[1] || '').trim();
    if (!/(department|team|desk|bank|support|service)/i.test(candidate)) scammerNames.push(candidate);
  }

  const supervisorNames = [];
  const supervisorRegex = /\b(?:supervisor|manager|officer|senior)\s*(?:name\s*is|is|:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  for (const m of text.matchAll(supervisorRegex)) {
    const candidate = String(m[1] || '').trim();
    if (!/(department|team|desk|bank|support|service)/i.test(candidate)) supervisorNames.push(candidate);
  }

  const transactionIds = [];
  const txnRegex = /\b(?:transaction\s*id|txn\s*id|utr|rrn)\s*[:#-]?\s*([A-Z0-9-]{6,})\b/gi;
  for (const m of text.matchAll(txnRegex)) {
    transactionIds.push(String(m[1] || '').toUpperCase());
  }

  const merchantNames = [];
  const merchantList = ['amazon', 'flipkart', 'myntra', 'paytm', 'phonepe', 'gpay', 'google pay', 'irctc', 'ola', 'uber', 'zomato', 'swiggy'];
  merchantList.forEach(name => {
    if (lower.includes(name)) merchantNames.push(name);
  });

  const appNames = [];
  const appList = ['anydesk', 'teamviewer', 'quicksupport', 'supremo', 'ammyy'];
  appList.forEach(app => {
    if (lower.includes(app)) appNames.push(app);
  });

  const suspiciousKeywords = [];
  const keywordList = ['urgent', 'immediately', 'right now', 'asap', 'blocked', 'suspended', 'freeze', 'verify', 'kyc', 'otp', 'refund', 'penalty', 'disconnection'];
  keywordList.forEach(word => {
    if (lower.includes(word)) suspiciousKeywords.push(word);
  });

  return {
    orgNames: unique(orgNames),
    departmentNames: unique(departmentNames),
    designations: unique(designations),
    employeeIds: unique(employeeIds),
    scammerNames: unique(scammerNames),
    supervisorNames: unique(supervisorNames),
    transactionIds: unique(transactionIds),
    merchantNames: unique(merchantNames),
    appNames: unique(appNames),
    suspiciousKeywords: unique(suspiciousKeywords)
  };
};

const computeScamDetected = (text) => {
  const lower = String(text || '').toLowerCase();
  const asksOtp = /\b(otp|one time password|pin|password|cvv|mpin|upi pin)\b/.test(lower) && /\b(share|send|provide|tell|enter|give)\b/.test(lower);
  const asksSensitive = /\b(account number|bank details|card number|cvv|upi pin|pin|password|otp)\b/.test(lower) && /\b(share|send|provide|tell|enter|give)\b/.test(lower);
  const threatensBlock = /\b(block|blocked|suspend|suspended|freeze|frozen|lock|locked|deactivate)\b/.test(lower) && /\b(within|in)\s+\d+\s*(minutes?|hours?)\b|\b\d+\s*(minutes?|hours?)\b/.test(lower);
  return asksOtp || asksSensitive || threatensBlock;
};

const buildAgentNotes = (intelSignals, combinedScammerText, turnNumber, prettyAmounts) => {
  const text = combinedScammerText || '';

  let scamType = 'Unknown';
  if (/\b(otp|pin|password|cvv|mpin)\b/i.test(text)) scamType = 'OTP phishing';
  else if (/\b(package|parcel|courier|india post|delivery|shipment|consignment|held|customs)\b/i.test(text)) scamType = 'India Post/Courier delivery';
  else if (/\b(traffic|challan|fine|violation|penalty|e-challan)\b/i.test(text)) scamType = 'Traffic violation penalty';
  else if (/\b(electricity|power|bill|disconnect|utility|water|gas)\b/i.test(text)) scamType = 'Electricity/Utility bill';
  else if (/\b(kyc|aadhaar|pan|update details|verify account)\b/i.test(text)) scamType = 'KYC update';
  else if (/\b(prize|lottery|lucky draw|won)\b/i.test(text)) scamType = 'Lottery/Prize';
  else if (/\b(refund|income tax|tax refund)\b/i.test(text)) scamType = 'Tax refund';
  else if (/\b(anydesk|teamviewer|quicksupport|remote|apk)\b/i.test(text)) scamType = 'Remote access';
  else if (/\b(transaction|unauthorized|debit|upi)\b/i.test(text)) scamType = 'Bank account/UPI fraud';

  const parts = [];
  parts.push(`${scamType} scam detected. Turn ${turnNumber}.`);

  const scammerName = intelSignals.scammerNames && intelSignals.scammerNames.length > 0
    ? intelSignals.scammerNames.join(', ')
    : 'Unknown';
  const employeeId = intelSignals.employeeIds && intelSignals.employeeIds.length > 0
    ? intelSignals.employeeIds.join(', ')
    : 'Not provided';
  parts.push(`Scammer identity: ${scammerName} (Employee ID: ${employeeId}).`);

  const org = intelSignals.orgNames && intelSignals.orgNames.length > 0
    ? intelSignals.orgNames.join(', ')
    : 'Not specified';
  parts.push(`Organization claimed: ${org}.`);

  const dept = intelSignals.departmentNames && intelSignals.departmentNames.length > 0
    ? intelSignals.departmentNames.join(', ')
    : 'Not specified';
  parts.push(`Department: ${dept}.`);

  const designation = intelSignals.designations && intelSignals.designations.length > 0
    ? intelSignals.designations.join(', ')
    : 'Not specified';
  parts.push(`Designation: ${designation}.`);

  const supervisor = intelSignals.supervisorNames && intelSignals.supervisorNames.length > 0
    ? intelSignals.supervisorNames.join(', ')
    : 'Not mentioned';
  parts.push(`Supervisor: ${supervisor}.`);

  const callback = intelSignals.callbackNumbers && intelSignals.callbackNumbers.length > 0
    ? intelSignals.callbackNumbers.join(', ')
    : 'Not provided';
  const email = intelSignals.emailAddresses && intelSignals.emailAddresses.length > 0
    ? intelSignals.emailAddresses.join(', ')
    : 'Not provided';
  parts.push(`Contact details: Callback ${callback}, Email ${email}.`);

  const ifsc = intelSignals.ifscCodes && intelSignals.ifscCodes.length > 0
    ? intelSignals.ifscCodes.join(', ')
    : 'Not provided';
  parts.push(`Location claims: IFSC ${ifsc}.`);

  const txnId = intelSignals.transactionIds && intelSignals.transactionIds.length > 0
    ? intelSignals.transactionIds.join(', ')
    : 'Not mentioned';
  const merchant = intelSignals.merchantNames && intelSignals.merchantNames.length > 0
    ? intelSignals.merchantNames.join(', ')
    : 'Not mentioned';
  const amount = intelSignals.amounts && intelSignals.amounts.length > 0
    ? intelSignals.amounts.join(', ')
    : 'Not mentioned';
  const prettyAmount = prettyAmounts && prettyAmounts.length > 0
    ? prettyAmounts.join(', ')
    : '';
  const amountDisplay = amount !== 'Not mentioned' ? amount : (prettyAmount || 'Not mentioned');
  const prettyNote = (amount !== 'Not mentioned' && prettyAmount && !prettyAmount.includes(amount))
    ? ` (reported as ${prettyAmount})`
    : '';
  parts.push(`Transaction details: ID ${txnId}, Merchant ${merchant}, Amount ${amountDisplay}${prettyNote}.`);

  const upi = intelSignals.upiIds && intelSignals.upiIds.length > 0
    ? intelSignals.upiIds.join(', ')
    : 'Not mentioned';
  const account = intelSignals.bankAccounts && intelSignals.bankAccounts.length > 0
    ? intelSignals.bankAccounts.join(', ')
    : 'Not mentioned';
  const last4 = intelSignals.accountLast4 && intelSignals.accountLast4.length > 0
    ? intelSignals.accountLast4.join(', ')
    : 'Not mentioned';
  parts.push(`Payment info: UPI ${upi}, Bank Account ${account}, Account Last 4 ${last4}.`);

  const caseId = intelSignals.complaintIds && intelSignals.complaintIds.length > 0
    ? intelSignals.complaintIds.join(', ')
    : 'Not mentioned';
  parts.push(`Case reference: Case/Ref ID ${caseId}.`);

  const apps = intelSignals.appNames && intelSignals.appNames.length > 0
    ? intelSignals.appNames.join(', ')
    : '';
  const links = intelSignals.phishingLinks && intelSignals.phishingLinks.length > 0
    ? intelSignals.phishingLinks.join(', ')
    : '';
  const appsLinks = [apps, links].filter(Boolean).join(', ') || 'None mentioned';
  parts.push(`Apps/Links: ${appsLinks}.`);

  const requests = [];
  if (/\b(otp|pin|password|cvv|mpin|upi pin)\b/i.test(text)) requests.push('OTP/PIN/password');
  if (/\b(account number|acc.*no|bank.*details)\b/i.test(text)) requests.push('account details');
  if (/\b(install|download|apk|anydesk|teamviewer|quicksupport)\b/i.test(text)) requests.push('app installation');
  if (/\b(fee|payment|pay|charge)\b/i.test(text)) requests.push('fee payment');
  if (/\b(traffic.*fine|challan.*payment|penalty.*amount|pay.*fine)\b/i.test(text)) requests.push('traffic fine payment');
  if (/\b(bill.*payment|pay.*bill|clear.*dues|pending.*amount)\b/i.test(text)) requests.push('utility bill payment');
  parts.push(`Scammer requests: ${requests.length > 0 ? requests.join(', ') : 'None detected'}.`);

  const urgencyMatches = text.match(/\b(immediately|urgent|now|within \d+.*(?:hour|minute)|in \d+.*(?:hour|minute)|2 hours|24 hours|right now|asap|quick)\b/gi) || [];
  const urgencyQuotes = urgencyMatches.length > 0 ? `"${[...new Set(urgencyMatches)].join('", "')}"` : 'None detected';
  parts.push(`Urgency tactics: ${urgencyQuotes}.`);

  const threats = [];
  if (/\b(block|blocked|suspend|suspended|freeze|frozen)\b/i.test(text)) threats.push('account blocked/suspended');
  if (/\b(lose|lost|theft|stolen|unauthorized)\b/i.test(text)) threats.push('money loss');
  if (/\b(legal|police|case|fir|complaint|action)\b/i.test(text)) threats.push('legal action');
  if (/\b(close|closed|terminate|deactivate)\b/i.test(text)) threats.push('account closure');
  parts.push(`Threats used: ${threats.length > 0 ? threats.join(', ') : 'None'}.`);

  const keywords = intelSignals.suspiciousKeywords && intelSignals.suspiciousKeywords.length > 0
    ? intelSignals.suspiciousKeywords.join(', ')
    : 'None';
  parts.push(`Suspicious keywords: ${keywords}.`);

  const redFlags = [];
  const orgInconsistencies = [];

  const emailAddresses = intelSignals.emailAddresses || [];
  const emailDomains = emailAddresses
    .map(e => String(e || '').toLowerCase().split('@')[1] || '')
    .filter(Boolean);
  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'proton.me', 'protonmail.com'];
  const orgMatchers = [
    { match: (o) => o.includes('sbi') || o.includes('state bank'), hints: ['sbi', 'sbibank', 'onlinesbi'] },
    { match: (o) => o.includes('hdfc'), hints: ['hdfc', 'hdfcbank'] },
    { match: (o) => o.includes('icici'), hints: ['icici'] },
    { match: (o) => o.includes('axis'), hints: ['axis', 'axisbank'] },
    { match: (o) => o.includes('pnb') || o.includes('punjab national'), hints: ['pnb'] },
    { match: (o) => o.includes('bank of baroda') || o.includes('bob') || o.includes('baroda'), hints: ['bob', 'bankofbaroda', 'baroda'] },
    { match: (o) => o.includes('canara'), hints: ['canara'] },
    { match: (o) => o.includes('union'), hints: ['unionbank', 'union'] },
    { match: (o) => o.includes('kotak'), hints: ['kotak'] },
    { match: (o) => o.includes('indusind'), hints: ['indusind'] },
    { match: (o) => o.includes('boi') || o.includes('bank of india'), hints: ['boi', 'bankofindia'] }
  ];
  const orgMatchesEmail = (orgName, emailAddr) => {
    const orgLower = String(orgName || '').toLowerCase();
    const domain = String(emailAddr || '').toLowerCase().split('@')[1] || '';
    if (!orgLower || !domain) return true;
    const matcher = orgMatchers.find(m => m.match(orgLower));
    if (!matcher) return true;
    return matcher.hints.some(h => domain.includes(h));
  };

  emailDomains.forEach(domain => {
    if (freeEmailDomains.includes(domain)) redFlags.push(`free email domain (${domain})`);
    if (!/(sbi|hdfc|icici|axis|pnb|bob|canara|union|kotak|indusind|bankofindia|boi)/i.test(domain)) {
      redFlags.push(`suspicious email domain (${domain})`);
    }
  });

  if (/\b(otp|pin|password|cvv|mpin|upi pin)\b/i.test(text)) redFlags.push('asked for OTP against policy');

  if (intelSignals.ifscCodes && intelSignals.ifscCodes.length > 0) {
    intelSignals.ifscCodes.forEach(code => {
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(code)) redFlags.push(`wrong IFSC format (${code})`);
    });
  }

  if (/\b(anydesk|teamviewer|quicksupport|supremo|ammyy)\b/i.test(text)) redFlags.push('suspicious app request');

  if (intelSignals.upiIds && intelSignals.upiIds.length > 0) {
    intelSignals.upiIds.forEach(upiId => {
      if (/@(paytm|phonepe|gpay|googlepay|okicici)/i.test(upiId)) redFlags.push(`personal UPI (${upiId})`);
    });
  }

  if (urgencyMatches.length > 2) redFlags.push('extreme urgency');

  if (intelSignals.orgNames && intelSignals.orgNames.length > 1) {
    redFlags.push('inconsistent org details');
    orgInconsistencies.push(`Multiple organizations claimed: ${intelSignals.orgNames.join(' vs ')}`);
  }

  if (intelSignals.orgNames && emailAddresses.length > 0) {
    intelSignals.orgNames.forEach(orgName => {
      emailAddresses.forEach(emailAddr => {
        if (!orgMatchesEmail(orgName, emailAddr)) {
          redFlags.push(`claim mismatch (${orgName} vs ${emailAddr})`);
          orgInconsistencies.push(`Claim mismatch: ${orgName} vs ${emailAddr}`);
        }
      });
    });
  }

  const uniqueRedFlags = unique(redFlags);
  parts.push(`Red flags detected: ${uniqueRedFlags.length > 0 ? uniqueRedFlags.join(' / ') : 'None'}.`);

  const uniqueOrgInconsistencies = unique(orgInconsistencies);
  parts.push(`Bank/org inconsistencies: ${uniqueOrgInconsistencies.length > 0 ? uniqueOrgInconsistencies.join(', ') : 'None detected'}.`);

  parts.push(`Scam pattern: ${scamType}.`);

  parts.push(`Conversation flow: Turn ${turnNumber} - Scammer ${scammerName !== 'Unknown' ? scammerName : ''} claimed to be from ${org} ${dept !== 'Not specified' ? dept : ''}. Requested ${requests.length > 0 ? requests.join(' and ') : 'information'}. Used ${urgencyMatches.length > 0 ? 'urgency tactics' : 'standard approach'}.`);

  const extracted = [];
  const missing = [];

  if (scammerName !== 'Unknown') extracted.push('scammer name'); else missing.push('scammer name');
  if (employeeId !== 'Not provided') extracted.push('employee ID'); else missing.push('employee ID');
  if (dept !== 'Not specified') extracted.push('department'); else missing.push('department');
  if (callback !== 'Not provided') extracted.push('callback'); else missing.push('callback');
  if (email !== 'Not provided') extracted.push('email'); else missing.push('email');
  if (upi !== 'Not mentioned') extracted.push('UPI');
  if (txnId !== 'Not mentioned') extracted.push('transaction ID');
  if (caseId !== 'Not mentioned') extracted.push('case ID');
  if (ifsc !== 'Not provided') extracted.push('IFSC');

  parts.push(`Extraction status: Extracted ${extracted.length > 0 ? extracted.join(', ') : 'none'}. Missing ${missing.join(', ')}.`);

  return parts.join(' ');
};

class HoneypotAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('Honeypot Agent initialized');
  }

  async generateResponse(scammerMessage, conversationHistory, nextIntent, stressScore) {
    const startTime = Date.now();
    console.log('Agent.generateResponse started');

    const history = conversationHistory || [];
    const turnNumber = history.length + 1;

    const maxContextTurns = 4;
    const contextWindow = history.slice(-maxContextTurns);
    const conversationContext = contextWindow.map((msg, idx) =>
      `Turn ${history.length - contextWindow.length + idx + 1}:\nScammer: ${msg.scammerMessage}\nYou: ${msg.agentReply || '(first message)'}`
    ).join('\n\n');
    const omittedNote = history.length > contextWindow.length ? 'Earlier turns omitted.' : '';

    const recentReplies = getRecentReplies(history, 5);
    const recentText = recentReplies.slice(-3).join(' ').toLowerCase();

    const askedIntents = unique(history.map(h => detectIntentFromReply(h.agentReply || '')).filter(Boolean));
    const lastIntent = detectIntentFromReply(recentReplies[recentReplies.length - 1] || '');

    const systemPrompt = `You are a conversational honeypot agent simulating a real Indian customer in a suspected fraud interaction.

Rules:
- Reply in 1-2 sentences and include exactly one question mark.
- Sound worried, cooperative, slightly confused. Address as "sir".
- Never accuse or mention scam or AI.
- Never ask for OTP, PIN, password, CVV, or full account number.
- Ask only one extraction detail (callback, ref ID, name, department, employee ID, last 4 digits, UPI, link, email, txn ID, amount, merchant, IFSC, app).
- Do not use "so I can" phrasing.
- Avoid generic questions like "what should I do".

Return JSON only with this schema:
{
  "reply": "...",
  "phase": "SHOCK|VERIFICATION|DELAY|DISENGAGE",
  "scamDetected": true/false,
  "intelSignals": {
    "bankAccounts": [],
    "accountLast4": [],
    "complaintIds": [],
    "employeeIds": [],
    "phoneNumbers": [],
    "callbackNumbers": [],
    "upiIds": [],
    "phishingLinks": [],
    "emailAddresses": [],
    "appNames": [],
    "transactionIds": [],
    "merchantNames": [],
    "amounts": [],
    "ifscCodes": [],
    "departmentNames": [],
    "designations": [],
    "supervisorNames": [],
    "scammerNames": [],
    "orgNames": [],
    "suspiciousKeywords": []
  },
  "agentNotes": "...",
  "shouldTerminate": false,
  "terminationReason": ""
}`;

    const userPrompt = `CONVERSATION (recent):
${omittedNote}
${conversationContext}

NEW MESSAGE: "${scammerMessage}"

Already asked topics: ${askedIntents.join(', ') || 'None'}

Return JSON only.`;

    const regexIntel = scanHistoryForIntel(history, scammerMessage);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 300
      });

      const rawResponse = completion.choices[0].message.content;
      const parsed = safeJsonParse(rawResponse);
      const agentResponse = parsed || {};

      const llmIntel = agentResponse.intelSignals || {};
      const textIntel = extractEntitiesFromText((history.map(h => h.scammerMessage).join(' ') + ' ' + scammerMessage).trim());

      const mergedIntel = mergeIntelSignals(llmIntel, {
        bankAccounts: regexIntel.bankAccounts,
        accountLast4: regexIntel.accountLast4,
        complaintIds: regexIntel.complaintIds,
        phoneNumbers: regexIntel.phoneNumbers,
        callbackNumbers: regexIntel.phoneNumbers,
        upiIds: regexIntel.upiIds,
        phishingLinks: regexIntel.urls,
        emailAddresses: regexIntel.emailAddresses,
        amounts: regexIntel.amounts,
        ifscCodes: regexIntel.ifscCodes,
        transactionIds: regexIntel.transactionIds
      }, textIntel);

      const normalizedIntelSignals = normalizeIntelSignals(mergedIntel);

      const prettyAmountCandidates = unique(regexIntel.amountsPretty || []);

      const combinedScammerText = `${history.map(h => h.scammerMessage || '').join(' ')} ${scammerMessage || ''}`.trim();
      const scamDetected = computeScamDetected(combinedScammerText);

      const generatedNotes = buildAgentNotes(
        normalizedIntelSignals,
        combinedScammerText,
        turnNumber,
        prettyAmountCandidates
      );

      const otpPressure = /\b(otp|pin|password|cvv|mpin|upi pin)\b/i.test(scammerMessage || '');
      const plannedIntent = planIntent({
        intel: normalizedIntelSignals,
        scammerMessage,
        lastIntent,
        turnNumber
      });

      let replyCandidate = agentResponse.reply || '';
      replyCandidate = normalizeWhitespace(replyCandidate);
      const replyValidation = validateReply(replyCandidate);

      let reply = replyCandidate;
      if (!replyValidation.ok) {
        reply = buildLocalReply({
          intent: plannedIntent,
          scammerMessage,
          recentText,
          turnNumber,
          otpPressure
        });
      }

      const finalValidation = validateReply(reply);
      if (!finalValidation.ok) {
        reply = buildLocalReply({
          intent: plannedIntent,
          scammerMessage,
          recentText,
          turnNumber,
          otpPressure
        });
      }

      const finalResponse = {
        reply,
        phase: agentResponse.phase || 'VERIFICATION',
        scamDetected,
        intelSignals: normalizedIntelSignals,
        agentNotes: generatedNotes || agentResponse.agentNotes || '',
        shouldTerminate: agentResponse.shouldTerminate || false,
        terminationReason: agentResponse.terminationReason || ''
      };

      const totalTime = Date.now() - startTime;
      console.log(`Total response time: ${totalTime} ms`);

      return finalResponse;

    } catch (error) {
      console.error('Error in generateResponse:', error);
      return {
        reply: 'Sir, I am a bit confused about this. Which reference number is showing there?',
        phase: 'VERIFICATION',
        scamDetected: true,
        intelSignals: {},
        agentNotes: `Error occurred: ${error.message}`,
        shouldTerminate: false,
        terminationReason: ''
      };
    }
  }
}

module.exports = HoneypotAgent;
