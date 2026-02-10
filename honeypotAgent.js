/**
 * FINAL ENHANCED Agentic Honey-Pot Agent
 * Handles ALL scam scenarios with natural, interlinked responses
 */

const { OpenAI } = require('openai');

class HoneypotAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('ï¿½ï¿½ï¿½ï¿½ FINAL Enhanced Honeypot Agent initialized');
  }

  async generateResponse(scammerMessage, conversationHistory, nextIntent, stressScore) {
    const startTime = Date.now();
    console.log('â±ï¸ Agent.generateResponse started');

    const totalMessages = conversationHistory.length;
    const scammerTurns = (conversationHistory || []).filter(m => m && m.scammerMessage).length;
    const turnNumber = scammerTurns + 1;

    // Build compact conversation context (speed)
    const maxContextTurns = 4;
    const contextWindow = (conversationHistory || []).slice(-maxContextTurns);
    const conversationContext = contextWindow.map((msg, idx) =>
      `Turn ${totalMessages - contextWindow.length + idx + 1}:\nScammer: ${msg.scammerMessage}\nYou: ${msg.agentReply || '(first message)'}`
    ).join('\n\n');
    const omittedNote = totalMessages > contextWindow.length ? 'Earlier turns omitted.' : '';

    const recentReplies = (conversationHistory || [])
      .map(msg => msg.agentReply || '')
      .filter(Boolean)
      .slice(-5);
    const recentText = recentReplies.join(' ').toLowerCase();

    const justificationVariants = [
      'so I do not mess up on my side',
      'so I can match it in my app',
      'so I can tell the bank properly',
      'so I can note it correctly',
      'so I can cross-check the SMS',
      'so I do not mix the details',
      'so I can confirm fast on my end',
      'so I can explain it if they ask',
      'so I do not get blocked wrongly',
      'so I can be sure I am reading it right',
      'so I can verify on my side',
      'so I can sort it quickly'
    ];

    const excuseVariants = [
      'SMS is delayed on my phone',
      'my phone is on silent',
      'battery is low so it is slow',
      'signal is weak right now',
      'data is slow right now',
      'I am in the metro and signal is patchy',
      'dual SIM is confusing me',
      'my app is lagging a bit',
      'WhatsApp messages are mixed up',
      'I am stepping out of the lift now'
    ];

    const fearVariants = [
      'I am getting nervous now',
      'this is making me anxious',
      'I am a bit shaken',
      'this is worrying me',
      'I am stressed about this'
    ];

    const bannedPhraseMap = {
      "i'm really scared": [
        'I am getting nervous now',
        'this is making me anxious',
        'I am a bit shaken'
      ],
      'network issue': [
        'signal is weak right now',
        'my data is slow right now',
        'my phone is acting up'
      ],
      'big amount': [
        'that is a lot',
        'that is very high',
        'that amount is too much for me'
      ],
      'check properly': [
        'double-check on my side',
        'cross-check once on my side',
        'verify on my side'
      ]
    };

    const UPI_SUFFIXES = [
      'okicici', 'oksbi', 'okhdfcbank', 'okaxis', 'okpnb', 'paytm', 'ybl', 'ibl', 'upi', 'axl', 'ok', 'apl',
      'freecharge', 'fbl', 'sbi', 'hdfcbank', 'icici', 'barodampay', 'mahb', 'kotak', 'indus', 'boi'
    ];
    const UPI_SUFFIX_SET = new Set(UPI_SUFFIXES);

    const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const pickVariant = (variants) => {
      if (!variants || variants.length === 0) return '';
      const unused = variants.filter(v => !recentText.includes(v.toLowerCase()));
      const pool = unused.length > 0 ? unused : variants;
      return pool[turnNumber % pool.length];
    };

    const systemPrompt = `You are a conversational honeypot agent simulating a real Indian customer in a suspected fraud interaction.

Goals:
- Keep the conversation going and extract intel quietly.
- Sound worried, cooperative, slightly confused. Address as "sir".
- Never accuse or mention scam/AI.

Safety:
- Never share OTP/PIN/password/CVV or full account numbers.

Reply rules (strict):
- 1â€“2 sentences only.
- Exactly one question.
- Every question must include a soft self-verify justification (e.g., "so I can check on my side...").
- Rotate phrasing; avoid repeating the same fear/excuse/justification from last 3 turns.
- Do NOT use "official email" wording or "confirm your identity" style.

Behavior:
- If asked for OTP/PIN/password, delay with a human excuse (SMS delay/signal/app lag/etc.) and ask for a different detail.
- Ask only ONE new detail that follows the scammer's last message.

Output JSON only with this schema:
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

    // BULLETPROOF MEMORY: Extract ACTUAL questions asked
    const allHoneypotQuestions = conversationHistory
      .map(msg => msg.agentReply || '')
      .join('\n');

    // Extract actual question sentences
    const actualQuestionsAsked = [];
    conversationHistory.forEach((msg, idx) => {
      if (msg.agentReply) {
        const questions = msg.agentReply.match(/[^.!?]*\?/g) || [];
        questions.forEach(q => {
          actualQuestionsAsked.push(`Turn ${idx + 1
            }: "${q.trim()}"`);
        });
      }
    });

    const recentQuestionsAsked = actualQuestionsAsked.slice(-6);

    // Topic tracking with Set
    const alreadyAsked = [];
    const addedTopics = new Set();

    // Check each question type with word boundaries for exact matching
    if (/\b(email|e-mail|email address)\b/i.test(allHoneypotQuestions) && !addedTopics.has('email')) {
      alreadyAsked.push('âœ— email');
      addedTopics.add('email');
    }
    if (/\b(ifsc|ifsc code|branch code)\b/i.test(allHoneypotQuestions) && !addedTopics.has('ifsc')) {
      alreadyAsked.push('âœ— IFSC');
      addedTopics.add('ifsc');
    }
    if (/\b(employee id|emp id|employee ID|staff id)\b/i.test(allHoneypotQuestions) && !addedTopics.has('empid')) {
      alreadyAsked.push('âœ— employee ID');
      addedTopics.add('empid');
    }
    if (/\b(callback|call back|callback number|contact number)\b/i.test(allHoneypotQuestions) && !addedTopics.has('callback')) {
      alreadyAsked.push('âœ— callback');
      addedTopics.add('callback');
    }
    if (/\b(branch address|full address|address of|located at)\b/i.test(allHoneypotQuestions) && !addedTopics.has('address')) {
      alreadyAsked.push('âœ— address');
      addedTopics.add('address');
    }
    if (/\b(supervisor|manager|senior|supervisor.*name)\b/i.test(allHoneypotQuestions) && !addedTopics.has('supervisor')) {
      alreadyAsked.push('âœ— supervisor');
      addedTopics.add('supervisor');
    }
    if (/\b(transaction id|transaction ID|txn id|txn ID)\b/i.test(allHoneypotQuestions) && !addedTopics.has('txnid')) {
      alreadyAsked.push('âœ— transaction ID');
      addedTopics.add('txnid');
    }
    if (/\b(merchant|company|vendor|shop)\b/i.test(allHoneypotQuestions) && !addedTopics.has('merchant')) {
      alreadyAsked.push('âœ— merchant');
      addedTopics.add('merchant');
    }
    if (/\b(upi|upi id|upi handle|upi ID)\b/i.test(allHoneypotQuestions) && !addedTopics.has('upi')) {
      alreadyAsked.push('âœ—  UPI');
      addedTopics.add('upi');
    }
    if (/\b(amount|how much|transaction amount|prize.*money|refund.*amount)\b/i.test(allHoneypotQuestions) && !addedTopics.has('amount')) {
      alreadyAsked.push('âœ— amount');
      addedTopics.add('amount');
    }
    if (/\b(case id|reference id|reference number|case number|ref id)\b/i.test(allHoneypotQuestions) && !addedTopics.has('caseid')) {
      alreadyAsked.push('âœ— case ID');
      addedTopics.add('caseid');
    }
    if (/\b(department|which department|what department)\b/i.test(allHoneypotQuestions) && totalMessages > 0 && !addedTopics.has('dept')) {
      alreadyAsked.push('âœ— department');
      addedTopics.add('dept');
    }
    if (/\b(name|who are you|what.*name|your name)\b/i.test(allHoneypotQuestions) && totalMessages > 0 && !addedTopics.has('name')) {
      alreadyAsked.push('âœ— name');
      addedTopics.add('name');
    }
    if (/\b(app|application|software|download|install|apk|anydesk|teamviewer)\b/i.test(allHoneypotQuestions) && !addedTopics.has('app')) {
      alreadyAsked.push('âœ— app/software');
      addedTopics.add('app');
    }
    if (/\b(link|website|url|domain)\b/i.test(allHoneypotQuestions) && !addedTopics.has('link')) {
      alreadyAsked.push('âœ— link/website');
      addedTopics.add('link');
    }
    if (/\b(fee|payment|pay|processing fee)\b/i.test(allHoneypotQuestions) && !addedTopics.has('fee')) {
      alreadyAsked.push('âœ— fee/payment');
      addedTopics.add('fee');
    }

    const isLikelyPhoneNumber = (digits) => /^[6-9]\d{9}$/.test(digits);
    const maskAccountNumber = (digits) => {
      const clean = String(digits || '').replace(/\D/g, '');
      if (!clean) return 'ending **';
      const suffix = clean.slice(-2);
      return `ending ${suffix}`;
    };

    // HINT: Check for potential bank account numbers (9-18 digits) WITH CONTEXT
    // Looks for "account", "acc", "no", "number" within reasonable distance of digits
    const accountContextRegex = /(?:account|acc|acct|a\/c)[\s\w.:#-]{0,20}?(\d{9,18})/gi;
    const matches = [...scammerMessage.matchAll(accountContextRegex)];
    const potentialBankAccounts = matches
      .map(m => (m[1] || '').replace(/\D/g, ''))
      .filter(n => n.length >= 9 && n.length <= 18 && !isLikelyPhoneNumber(n));
    const maskedAccounts = potentialBankAccounts.map(maskAccountNumber);

    const bankAccountHint = potentialBankAccounts.length > 0
      ? `âš ï¸ SYSTEM NOTICE: I DETECTED A BANK ACCOUNT NUMBER (masked): ${maskedAccounts.join(', ')} (based on 'account' keyword). React without repeating full digits.`
      : '';

    // Check for REAL money mention (symbols, currency words). 
    // EXCLUDES simple numbers or phone numbers (requires currency context).
    const moneyMentioned = /(?:rs\.?|inr|rupees|â‚¹|\$|usd)\s*[\d,.]+[k]?/i.test(scammerMessage) ||
      /(?:amount|fee|charge|bill|balance).{0,15}?[\d,.]+[k]?/i.test(scammerMessage);

    // Check for merchant mention
    const merchantMentioned = /(?:merchant|store|shop|amazon|flipkart|myntra|paytm|ebay|google pay)/i.test(scammerMessage);

    const shockPhrases = [
      'This is alarming',
      'Oh no, this is worrying me',
      'I am getting anxious now',
      'This is stressing me out'
    ];
    const accountShockPhrases = [
      'Wait, that looks like my account',
      'Hold on, that seems like my account details',
      'One sec, that looks like my account info'
    ];
    const moneyShockPhrases = [
      'That is a lot',
      'That amount is very high',
      'This amount is too much for me',
      'That is quite a lot'
    ];

    const shockPhrase = pickVariant(shockPhrases);
    const accountShockPhrase = pickVariant(accountShockPhrases);
    const moneyShockPhrase = pickVariant(moneyShockPhrases);

    const focusHints = [];
    if (!addedTopics.has('callback')) focusHints.push('callback number');
    if (/\b(upi|payment|refund|collect|transfer)\b/i.test(scammerMessage)) focusHints.push('UPI ID');
    if (/\b(link|website|url)\b/i.test(scammerMessage)) focusHints.push('link/website');
    if (/\b(email|mail)\b/i.test(scammerMessage)) focusHints.push('email ID');
    if (/\b(amount|rs\.|inr|rupees|₹|fee|fine|bill|due|penalty)\b/i.test(scammerMessage)) focusHints.push('amount');
    if (/\b(case|ref|reference|complaint|challan|consignment|tracking|awb|docket)\b/i.test(scammerMessage)) focusHints.push('case/reference ID');
    const focusLine = focusHints.length > 0 ? `Suggested focus: ${[...new Set(focusHints)].join(', ')}` : '';

    const userPrompt = `CONVERSATION (recent):
${omittedNote}
${conversationContext}

NEW MESSAGE: "${scammerMessage}"

Already asked topics: ${alreadyAsked.join(', ') || 'None'}
Recent questions asked:
${recentQuestionsAsked.length > 0 ? recentQuestionsAsked.join('\\n') : 'None'}

Hints:
- Do not repeat asked topics.
- If scammer asks OTP/PIN/password: delay with a NEW excuse and ask a different detail.
${bankAccountHint}
${moneyMentioned ? `- Amount mentioned: react briefly, then ask one related detail.` : ''}
${merchantMentioned ? `- Merchant mentioned: deny politely, then ask one related detail.` : ''}
${focusLine ? `- ${focusLine}` : ''}

Reply with JSON only.`;

    // START REGEX EXTRACTION HELPER
    const scanHistoryForIntel = (history, currentMsg) => {
      const fullText = history.map(h => `${h.scammerMessage} ${h.agentReply}`).join(' ') + ' ' + currentMsg;

      const unique = (arr) => [...new Set((arr || []).filter(Boolean))];

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

      const extractEmails = (text) => unique(text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g) || [])
        .map(v => v.toLowerCase());

      const extractUpiIds = (text) => {
        const matches = [];
        const upiRegex = new RegExp(`\\b([a-zA-Z0-9._-]{2,256})@(${upiSuffixPattern})(?![\\w])(?!\\.[a-zA-Z])`, 'gi');
        for (const m of text.matchAll(upiRegex)) {
          matches.push(`${m[1]}@${m[2]}`);
        }
        return unique(matches);
      };

      const extractIfscCodes = (text) => unique((text.match(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi) || [])
        .map(v => v.toUpperCase()));

      const extractBankAccounts = (text) => {
        const matches = [];
        const regex = /(?:^|[^\d])(\d{9,18})(?!\d)/g;
        let m;
        while ((m = regex.exec(text)) !== null) {
          const digits = m[1];
          if (/^[6-9]\d{9}$/.test(digits)) continue;
          matches.push(digits);
        }
        return unique(matches);
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
          if (!amountMap.has(canonical)) {
            amountMap.set(canonical, pretty || canonical);
          }
        };

        const currencyRegex = /\b(?:rs\.?|inr|rupees|₹)\s*([0-9][0-9,]*(?:\.\d+)?)(?:\s*(k|lac|lakh|crore|cr))?\b/gi;
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
        const regex = /\b(case|ref(?:erence)?|complaint|challan|consignment|tracking|awb|docket|ticket)\s*(?:id|no|number|#|:)?\s*([A-Z0-9][A-Z0-9-]{3,})\b/gi;
        for (const m of text.matchAll(regex)) {
          const token = (m[2] || '').toUpperCase();
          if (!token) continue;
          const hasDigit = /\d/.test(token);
          const hasLetter = /[A-Z]/.test(token);
          const isMixed = hasDigit && hasLetter;
          if (hasDigit || /-/.test(token) || (token.length >= 6 && isMixed)) {
            ids.push(token);
          }
        }
        return unique(ids);
      };

      const { amounts, amountsPretty } = extractAmounts(fullText);

      return {
        phoneNumbers: extractPhoneNumbers(fullText),
        emailAddresses: extractEmails(fullText),
        upiIds: extractUpiIds(fullText),
        ifscCodes: extractIfscCodes(fullText),
        bankAccounts: extractBankAccounts(fullText),
        amounts,
        amountsPretty,
        complaintIds: extractComplaintIds(fullText),
        urls: unique(fullText.match(/https?:\/\/[^\s]+/g) || [])
      };
    };
    // END REGEX EXTRACTION HELPER

    try {
      console.log('â±ï¸ Calling OpenAI...');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 300
      });

      const llmTime = Date.now() - startTime;
      console.log(`â±ï¸ LLM responded in ${llmTime} ms`);

      const rawResponse = completion.choices[0].message.content;
      console.log('ðŸ¤– LLM Raw Response:', rawResponse);

      const agentResponse = JSON.parse(rawResponse);

      const getUnique = (arr) => [...new Set(arr || [])];
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
        const isMixed = hasDigit && hasLetter;
        if (!(hasDigit || /-/.test(cleaned) || (cleaned.length >= 6 && isMixed))) return null;
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
        if (!/^https?:\/\//i.test(cleaned)) return null;
        return cleaned;
      };

      // 1. Get LLM extraction
      const llmIntel = agentResponse.intelSignals || {};

      // 2. Get Regex extraction from FULL history
      const regexIntel = scanHistoryForIntel(conversationHistory, scammerMessage);
      const prettyAmountCandidates = getUnique([
        ...(regexIntel.amountsPretty || []),
        ...((llmIntel.amounts || []).filter(v => /[^\d]/.test(String(v))))
      ]);

      // 3. Merge both (Code-side Regex supplements LLM)
      const mergedIntel = {
        bankAccounts: getUnique([...(llmIntel.bankAccounts || []), ...regexIntel.bankAccounts]),
        accountLast4: llmIntel.accountLast4,
        complaintIds: getUnique([...(llmIntel.complaintIds || []), ...regexIntel.complaintIds]),
        employeeIds: llmIntel.employeeIds,
        phoneNumbers: getUnique([...(llmIntel.phoneNumbers || []), ...regexIntel.phoneNumbers]),
        callbackNumbers: getUnique([...(llmIntel.callbackNumbers || []), ...regexIntel.phoneNumbers]),
        upiIds: getUnique([...(llmIntel.upiIds || []), ...regexIntel.upiIds]),
        phishingLinks: getUnique([...(llmIntel.phishingLinks || []), ...regexIntel.urls]),
        emailAddresses: getUnique([...(llmIntel.emailAddresses || []), ...regexIntel.emailAddresses]),
        appNames: llmIntel.appNames,
        transactionIds: llmIntel.transactionIds,
        merchantNames: llmIntel.merchantNames,
        amounts: getUnique([...(llmIntel.amounts || []), ...regexIntel.amounts]),
        ifscCodes: getUnique([...(llmIntel.ifscCodes || []), ...regexIntel.ifscCodes]),
        departmentNames: llmIntel.departmentNames,
        designations: llmIntel.designations,
        supervisorNames: llmIntel.supervisorNames,
        scammerNames: llmIntel.scammerNames,
        orgNames: llmIntel.orgNames,
        suspiciousKeywords: llmIntel.suspiciousKeywords
      };

      const normalizeList = (value, normalizer) => {
        if (!Array.isArray(value)) return [];
        const cleaned = value
          .map(v => (v === null || v === undefined) ? '' : String(v).trim())
          .map(v => (normalizer ? normalizer(v) : v))
          .filter(v => v && !/must match callbacknumbers/i.test(v));
        return [...new Set(cleaned)];
      };

      const normalizeIntelSignals = (intel) => {
        const safe = intel || {};
        const normalizers = {
          bankAccounts: normalizeBankAccount,
          accountLast4: (v) => String(v || '').replace(/\D/g, '').slice(-4),
          complaintIds: normalizeComplaintId,
          employeeIds: (v) => String(v || '').trim(),
          phoneNumbers: normalizePhoneNumber,
          callbackNumbers: normalizePhoneNumber,
          upiIds: normalizeUpiId,
          phishingLinks: normalizeUrl,
          emailAddresses: normalizeEmail,
          appNames: (v) => String(v || '').trim(),
          transactionIds: (v) => String(v || '').trim(),
          merchantNames: (v) => String(v || '').trim(),
          amounts: normalizeAmountValue,
          ifscCodes: normalizeIfsc,
          departmentNames: (v) => String(v || '').trim(),
          designations: (v) => String(v || '').trim(),
          supervisorNames: (v) => String(v || '').trim(),
          scammerNames: (v) => String(v || '').trim(),
          orgNames: (v) => String(v || '').trim(),
          suspiciousKeywords: (v) => String(v || '').trim()
        };
        const normalized = {};
        for (const key in safe) {
          normalized[key] = normalizeList(safe[key], normalizers[key]);
        }
        return normalized;
      };

      const normalizedIntelSignals = normalizeIntelSignals(mergedIntel);
      const normalizedPrettyAmounts = getUnique(
        (prettyAmountCandidates || []).map(v => String(v || '').trim()).filter(Boolean)
      );

      const combinedScammerText = [
        ...(conversationHistory || []).map(msg => msg.scammerMessage || ''),
        scammerMessage || ''
      ].join(' ');

      const enrichIntelSignals = (intel, text) => {
        const enriched = { ...intel };

        // Derive accountLast4 from bankAccounts if missing
        if ((!enriched.accountLast4 || enriched.accountLast4.length === 0) && enriched.bankAccounts && enriched.bankAccounts.length > 0) {
          enriched.accountLast4 = getUnique(enriched.bankAccounts.map(n => String(n).slice(-4)));
        }

        // Remove complaintIds that are substrings of known bank accounts (common false positives)
        if (enriched.complaintIds && enriched.bankAccounts && enriched.bankAccounts.length > 0) {
          const accountSet = new Set(enriched.bankAccounts.map(a => String(a)));
          enriched.complaintIds = enriched.complaintIds.filter(id => {
            const idStr = String(id);
            for (const acc of accountSet) {
              if (acc.includes(idStr)) return false;
            }
            return true;
          });
        }

        // Org names from text
        if (!enriched.orgNames || enriched.orgNames.length === 0) {
          const orgMatches = [];
          const orgPatterns = [
            /\bSBI\b|\bState Bank\b/gi,
            /\bHDFC\b/gi,
            /\bICICI\b/gi,
            /\bAxis\b/gi,
            /\bPNB\b|\bPunjab National\b/gi,
            /\bBank of Baroda\b|\bBoB\b/gi,
            /\bCanara\b/gi,
            /\bUnion Bank\b/gi,
            /\bKotak\b/gi,
            /\bIndusInd\b/gi,
            /\bBank of India\b|\bBOI\b/gi
          ];
          orgPatterns.forEach(pattern => {
            const m = text.match(pattern);
            if (m) orgMatches.push(...m.map(v => v.trim()));
          });
          enriched.orgNames = getUnique(orgMatches);
        }

        // Department names from text
        if (!enriched.departmentNames || enriched.departmentNames.length === 0) {
          const deptMatches = [];
          const deptRegex = /\b([A-Za-z ]+?(?:Department|Dept|Division|Cell))\b/gi;
          for (const m of text.matchAll(deptRegex)) {
            const val = m[1].trim();
            if (val.length >= 4 && !/account|bank/i.test(val)) {
              deptMatches.push(val);
            }
          }
          enriched.departmentNames = getUnique(deptMatches);
        }

        // Supervisor names from text
        if (!enriched.supervisorNames || enriched.supervisorNames.length === 0) {
          const supMatches = [];
          const supRegex = /\b(supervisor|manager)\b[^.:\n]{0,40}?\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
          for (const m of text.matchAll(supRegex)) {
            supMatches.push(m[2].trim());
          }
          enriched.supervisorNames = getUnique(supMatches);
        }

        // Scammer names from text
        if (!enriched.scammerNames || enriched.scammerNames.length === 0) {
          const nameMatches = [];
          const nameRegex = /\b(my name is|this is)\b\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/gi;
          for (const m of text.matchAll(nameRegex)) {
            nameMatches.push(m[2].trim());
          }
          enriched.scammerNames = getUnique(nameMatches);
        }

        return enriched;
      };

      const enrichedIntelSignals = enrichIntelSignals(normalizedIntelSignals, combinedScammerText);

      const buildAgentNotes = (intelSignals, combinedScammerText, scamDetected, turnNumber, prettyAmounts) => {
        // Detect scam type based on content
        let scamType = 'Unknown';
        if (/\b(otp|pin|password|cvv|mpin)\b/i.test(combinedScammerText)) {
          scamType = 'OTP phishing';
        } else if (/\b(package|parcel|courier|india post|delivery|shipment|consignment|held|address.*issue|customs.*clearance)\b/i.test(combinedScammerText)) {
          scamType = 'India Post/Courier delivery';
        } else if (/\b(traffic|challan|fine|violation|penalty|e-challan|motor.*vehicle|overspeed|signal.*jump)\b/i.test(combinedScammerText)) {
          scamType = 'Traffic violation penalty';
        } else if (/\b(electricity|power|bill|disconnect|cut|utility|water|gas|pending.*bill|due.*payment|service.*bill)\b/i.test(combinedScammerText)) {
          scamType = 'Electricity/Utility bill';
        } else if (/\b(kyc|aadhaar|pan|update.*details|verify.*account)\b/i.test(combinedScammerText)) {
          scamType = 'KYC update';
        } else if (/\b(won|prize|lottery|lucky draw)\b/i.test(combinedScammerText)) {
          scamType = 'Lottery/Prize';
        } else if (/\b(refund|tax|income tax)\b/i.test(combinedScammerText)) {
          scamType = 'Tax refund';
        } else if (/\b(anydesk|teamviewer|quicksupport|remote|install|download.*apk)\b/i.test(combinedScammerText)) {
          scamType = 'Remote access trojan';
        } else if (/\b(transaction|unauthorized|debit|upi)\b/i.test(combinedScammerText)) {
          scamType = 'Bank account/UPI fraud';
        }

        // Build comprehensive notes
        const parts = [];

        // Scam type and turn
        parts.push(`${scamType} scam detected. Turn ${turnNumber}.`);

        // Scammer identity
        const scammerName = intelSignals.scammerNames && intelSignals.scammerNames.length > 0
          ? intelSignals.scammerNames.join(', ')
          : 'Unknown';
        const employeeId = intelSignals.employeeIds && intelSignals.employeeIds.length > 0
          ? intelSignals.employeeIds.join(', ')
          : 'Not provided';
        parts.push(`Scammer identity: ${scammerName} (Employee ID: ${employeeId}).`);

        // Organization
        const org = intelSignals.orgNames && intelSignals.orgNames.length > 0
          ? intelSignals.orgNames.join(', ')
          : 'Not specified';
        parts.push(`Organization claimed: ${org}.`);

        // Department
        const dept = intelSignals.departmentNames && intelSignals.departmentNames.length > 0
          ? intelSignals.departmentNames.join(', ')
          : 'Not specified';
        parts.push(`Department: ${dept}.`);

        // Designation
        const designation = intelSignals.designations && intelSignals.designations.length > 0
          ? intelSignals.designations.join(', ')
          : 'Not specified';
        parts.push(`Designation: ${designation}.`);

        // Supervisor
        const supervisor = intelSignals.supervisorNames && intelSignals.supervisorNames.length > 0
          ? intelSignals.supervisorNames.join(', ')
          : 'Not mentioned';
        parts.push(`Supervisor: ${supervisor}.`);

        // Contact details
        const callback = intelSignals.callbackNumbers && intelSignals.callbackNumbers.length > 0
          ? intelSignals.callbackNumbers.join(', ')
          : 'Not provided';
        const email = intelSignals.emailAddresses && intelSignals.emailAddresses.length > 0
          ? intelSignals.emailAddresses.join(', ')
          : 'Not provided';
        parts.push(`Contact details: Callback ${callback}, Email ${email}.`);

        // Location claims
        const ifsc = intelSignals.ifscCodes && intelSignals.ifscCodes.length > 0
          ? intelSignals.ifscCodes.join(', ')
          : 'Not provided';
        const branch = intelSignals.branchNames && intelSignals.branchNames.length > 0
          ? intelSignals.branchNames.join(', ')
          : 'Not provided';
        parts.push(`Location claims: IFSC ${ifsc}, Branch ${branch}.`);

        // Transaction details
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

        // Payment info
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

        // Case reference
        const caseId = intelSignals.complaintIds && intelSignals.complaintIds.length > 0
          ? intelSignals.complaintIds.join(', ')
          : 'Not mentioned';
        parts.push(`Case reference: Case/Ref ID ${caseId}.`);

        // Apps/Links
        const apps = intelSignals.appNames && intelSignals.appNames.length > 0
          ? intelSignals.appNames.join(', ')
          : '';
        const links = intelSignals.phishingLinks && intelSignals.phishingLinks.length > 0
          ? intelSignals.phishingLinks.join(', ')
          : '';
        const appsLinks = [apps, links].filter(x => x).join(', ') || 'None mentioned';
        parts.push(`Apps/Links: ${appsLinks}.`);

        // Scammer requests
        const requests = [];
        if (/\b(otp|pin|password|cvv|mpin)\b/i.test(combinedScammerText)) {
          requests.push('OTP/PIN/password');
        }
        if (/\b(account number|acc.*no|bank.*details)\b/i.test(combinedScammerText)) {
          requests.push('account details');
        }
        if (/\b(install|download|apk|anydesk|teamviewer)\b/i.test(combinedScammerText)) {
          requests.push('app installation');
        }
        if (/\b(fee|payment|pay|charge)\b/i.test(combinedScammerText)) {
          requests.push('fee payment');
        }
        if (/\b(unlock|release|clear.*package|customs.*fee|delivery.*charge)\b/i.test(combinedScammerText)) {
          requests.push('package unlock fee');
        }
        if (/\b(traffic.*fine|challan.*payment|penalty.*amount|pay.*fine)\b/i.test(combinedScammerText)) {
          requests.push('traffic fine payment');
        }
        if (/\b(bill.*payment|pay.*bill|clear.*dues|pending.*amount)\b/i.test(combinedScammerText)) {
          requests.push('utility bill payment');
        }
        if (/\b(tracking.*number|consignment.*no|AWB|docket.*no|reference.*no)\b/i.test(combinedScammerText)) {
          requests.push('tracking/reference number');
        }
        if (/\b(consumer\s*(number|id)|customer\s*id|service\s*number|account\s*id)\b/i.test(combinedScammerText)) {
          requests.push('consumer/account ID');
        }
        parts.push(`Scammer requests: ${requests.length > 0 ? requests.join(', ') : 'None detected'}.`);

        // Urgency tactics - extract direct quotes
        const urgencyMatches = combinedScammerText.match(/\b(immediately|urgent|now|within \d+.*(?:hour|minute)|in \d+.*(?:hour|minute)|2 hours|24 hours|right now|asap|quick)\b/gi) || [];
        const urgencyQuotes = urgencyMatches.length > 0 ? `"${[...new Set(urgencyMatches)].join('", "')}"` : 'None detected';
        parts.push(`Urgency tactics: ${urgencyQuotes}.`);

        // Threats used
        const threats = [];
        if (/\b(block|blocked|suspend|suspended|freeze|frozen)\b/i.test(combinedScammerText)) {
          threats.push('account blocked/suspended');
        }
        if (/\b(lose|lost|theft|stolen|unauthorized)\b/i.test(combinedScammerText)) {
          threats.push('money loss');
        }
        if (/\b(legal|police|case|fir|complaint|action)\b/i.test(combinedScammerText)) {
          threats.push('legal action');
        }
        if (/\b(close|closed|terminate|deactivate)\b/i.test(combinedScammerText)) {
          threats.push('account closure');
        }
        parts.push(`Threats used: ${threats.length > 0 ? threats.join(', ') : 'None'}.`);

        // Suspicious keywords
        const keywords = intelSignals.suspiciousKeywords && intelSignals.suspiciousKeywords.length > 0
          ? intelSignals.suspiciousKeywords.join(', ')
          : 'None';
        parts.push(`Suspicious keywords: ${keywords}.`);

        // Red flags detection
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

        // Email domain checks
        emailDomains.forEach(domain => {
          if (freeEmailDomains.includes(domain)) {
            redFlags.push(`free email domain (${domain})`);
          }
          if (!/(sbi|hdfc|icici|axis|pnb|bob|canara|union|kotak|indusind|bankofindia|boi)/i.test(domain)) {
            redFlags.push(`suspicious email domain (${domain})`);
          }
        });

        // OTP request
        if (/\b(otp|pin|password|cvv|mpin)\b/i.test(combinedScammerText)) {
          redFlags.push('asked for OTP against policy');
        }

        // Wrong IFSC format
        if (intelSignals.ifscCodes && intelSignals.ifscCodes.length > 0) {
          intelSignals.ifscCodes.forEach(code => {
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(code)) {
              redFlags.push(`wrong IFSC format (${code})`);
            }
          });
        }

        // Suspicious apps
        if (/\b(anydesk|teamviewer|quicksupport|supremo|ammyy)\b/i.test(combinedScammerText)) {
          redFlags.push('suspicious app request');
        }

        // Personal UPI
        if (intelSignals.upiIds && intelSignals.upiIds.length > 0) {
          intelSignals.upiIds.forEach(upiId => {
            if (/@(paytm|phonepe|gpay|googlepay|okicici)/i.test(upiId)) {
              redFlags.push(`personal UPI (${upiId})`);
            }
          });
        }

        // Extreme urgency
        if (urgencyMatches.length > 2) {
          redFlags.push('extreme urgency');
        }

        // Inconsistent org details
        if (intelSignals.orgNames && intelSignals.orgNames.length > 1) {
          redFlags.push('inconsistent org details');
          orgInconsistencies.push(`Multiple organizations claimed: ${intelSignals.orgNames.join(' vs ')}`);
        }

        // Claim mismatch: org vs email
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

        const uniqueRedFlags = [...new Set(redFlags)];
        parts.push(`Red flags detected: ${uniqueRedFlags.length > 0 ? uniqueRedFlags.join(' / ') : 'None'}.`);

        const uniqueOrgInconsistencies = [...new Set(orgInconsistencies)];
        parts.push(`Bank/org inconsistencies: ${uniqueOrgInconsistencies.length > 0 ? uniqueOrgInconsistencies.join(', ') : 'None detected'}.`);

        // Scam pattern
        parts.push(`Scam pattern: ${scamType}.`);

        // Conversation flow
        parts.push(`Conversation flow: Turn ${turnNumber} - Scammer ${scammerName !== 'Unknown' ? scammerName : ''} claimed to be from ${org} ${dept !== 'Not specified' ? dept : ''}. Requested ${requests.length > 0 ? requests.join(' and ') : 'information'}. Used ${urgencyMatches.length > 0 ? 'urgency tactics' : 'standard approach'}.`);

        // Agent strategy (inferred from what questions could be asked)
        const askedAbout = [];
        if (scammerName !== 'Unknown') askedAbout.push('name');
        if (employeeId !== 'Not provided') askedAbout.push('employee ID');
        if (callback !== 'Not provided') askedAbout.push('callback');
        if (email !== 'Not provided') askedAbout.push('email');
        if (dept !== 'Not specified') askedAbout.push('department');

        const notAskedYet = [];
        if (callback === 'Not provided') notAskedYet.push('callback number');
        if (email === 'Not provided') notAskedYet.push('email');
        if (upi === 'Not mentioned' && combinedScammerText.includes('UPI')) notAskedYet.push('UPI ID');
        if (txnId === 'Not mentioned' && combinedScammerText.includes('transaction')) notAskedYet.push('transaction ID');

        parts.push(`Agent strategy: ${askedAbout.length > 0 ? 'Extracted ' + askedAbout.join(', ') : 'Initial extraction phase'}. ${notAskedYet.length > 0 ? 'Still need: ' + notAskedYet.join(', ') : 'Continuing verification'}.`);

        // Extraction status
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

      const replaceIfRepeated = (text, variants) => {
        if (!text) return text;
        let updated = text;
        variants.forEach(phrase => {
          const lowerPhrase = phrase.toLowerCase();
          if (updated.toLowerCase().includes(lowerPhrase) && recentText.includes(lowerPhrase)) {
            const replacement = pickVariant(variants.filter(v => v.toLowerCase() !== lowerPhrase));
            if (replacement) {
              const re = new RegExp(escapeRegExp(phrase), 'i');
              updated = updated.replace(re, replacement);
            }
          }
        });
        return updated;
      };

      const applyAntiRepetition = (text) => {
        if (!text) return text;
        let updated = text;
        Object.entries(bannedPhraseMap).forEach(([phrase, alternatives]) => {
          const lowerPhrase = phrase.toLowerCase();
          if (updated.toLowerCase().includes(lowerPhrase) && recentText.includes(lowerPhrase)) {
            const replacement = pickVariant(alternatives);
            if (replacement) {
              const re = new RegExp(escapeRegExp(phrase), 'i');
              updated = updated.replace(re, replacement);
            }
          }
        });
        updated = replaceIfRepeated(updated, justificationVariants);
        updated = replaceIfRepeated(updated, excuseVariants);
        updated = replaceIfRepeated(updated, fearVariants);
        return updated;
      };

      const enforceSentenceLimit = (text, maxSentences = 2) => {
        if (!text) return text;
        const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
        if (sentences.length <= maxSentences) return text.trim();
        const questionIndex = sentences.findIndex(s => s.includes('?'));
        if (questionIndex === -1 || questionIndex < maxSentences) {
          return sentences.slice(0, maxSentences).join('').trim();
        }
        const start = Math.max(0, questionIndex - 1);
        return sentences.slice(start, start + maxSentences).join('').trim();
      };

      const enforceSingleQuestion = (text) => {
        if (!text) return text;
        const questionMarks = text.match(/\?/g) || [];
        if (questionMarks.length <= 1) return text.trim();
        const firstIdx = text.indexOf('?');
        return (text.slice(0, firstIdx + 1) + text.slice(firstIdx + 1).replace(/\?/g, '.')).trim();
      };

      const ensureSelfVerifyJustification = (text) => {
        if (!text || !text.includes('?')) return text;
        const lower = text.toLowerCase();
        const hasJustification = justificationVariants.some(p => lower.includes(p.toLowerCase()));
        if (hasJustification) return text;
        const justification = pickVariant(justificationVariants);
        const idx = text.lastIndexOf('?');
        if (idx === -1) return text;
        return `${text.slice(0, idx)}, ${justification}?${text.slice(idx + 1)}`.trim();
      };

      const redactSensitive = (text) => {
        if (!text) return text;
        let updated = text;
        updated = updated.replace(/\b(otp|pin|password|cvv|mpin)\b[^\d]{0,6}(\d{4,8})\b/gi, '$1 xxxx');
        updated = updated.replace(/\b\d{9,18}\b/g, 'last few digits');
        return updated;
      };

      const generatedNotes = buildAgentNotes(
        enrichedIntelSignals,
        combinedScammerText,
        !!agentResponse.scamDetected,
        turnNumber,
        normalizedPrettyAmounts
      );


      let reply = agentResponse.reply || "I'm a bit confused about this, sir. What reference number is showing, so I can verify on my side?";
      reply = applyAntiRepetition(reply);
      reply = enforceSentenceLimit(reply);
      reply = enforceSingleQuestion(reply);
      reply = ensureSelfVerifyJustification(reply);
      reply = redactSensitive(reply);

      const finalResponse = {
        reply,
        phase: agentResponse.phase || "VERIFICATION",
        scamDetected: agentResponse.scamDetected || false,
        intelSignals: enrichedIntelSignals,
        agentNotes: generatedNotes || agentResponse.agentNotes || "",
        shouldTerminate: agentResponse.shouldTerminate || false,
        terminationReason: agentResponse.terminationReason || ""
      };

      const totalTime = Date.now() - startTime;
      console.log(`âœ… Total response time: ${totalTime} ms`);

      return finalResponse;

    } catch (error) {
      console.error('âŒ Error in generateResponse:', error);
      return {
        reply: "I'm a bit confused. Can you provide more information?",
        phase: "VERIFICATION",
        scamDetected: true,
        intelSignals: {},
        agentNotes: `Error occurred: ${error.message} `,
        shouldTerminate: false,
        terminationReason: ""
      };
    }
  }
}

module.exports = HoneypotAgent;









