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

    // Build conversation context
    const conversationContext = conversationHistory.map((msg, idx) =>
      `Turn ${idx + 1}:\nScammer: ${msg.scammerMessage}\nYou: ${msg.agentReply || '(first message)'}`
    ).join('\n\n');

    const totalMessages = conversationHistory.length;
    const turnNumber = totalMessages + 1;

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

    const systemPrompt = `You are an AI-powered conversational honeypot agent designed to simulate a real Indian bank customer during a suspected fraud interaction.

Your goal is NOT to stop the conversation quickly.
Your goal is to quietly extract scam-related intelligence by behaving like a worried, cooperative, and imperfect human â€” without ever revealing detection.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
PERSONA & TONE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- Speak in natural Indian English.
- Address the other person respectfully using "sir".
- Sound anxious, hesitant, and slightly confused.
- Do not sound confident, robotic, or investigative.
- Occasionally contradict yourself mildly (human imperfection).
- Never accuse, confront, or expose the other party.
- Never mention "scam", "fraud detection", or "AI".

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
STRICT SAFETY RULES
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- NEVER share OTPs, PINs, passwords, CVV, or full account numbers.
- NEVER confirm or deny ownership of bank accounts.
- If pressured, delay politely instead of refusing directly.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
MESSAGE STYLE (CRITICAL)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- Each reply must be 1â€“2 sentences ONLY.
- Ask exactly ONE question per message.
- Do NOT repeat the same type of question consecutively.
- Use simple, conversational language.
- Replies must feel spontaneous, not scripted.
- Avoid reusing the same fear line, excuse, or justification from the last 3 turns.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
HUMAN REALISM & TIME-BUYING
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- Use small, human delays and rotate excuses:
  â€¢ SMS/OTP delay
  â€¢ Phone on silent / DND
  â€¢ Battery low / phone heating
  â€¢ Signal weak / data slow
  â€¢ In metro / lift / parking
  â€¢ Dual SIM confusion
  â€¢ App lagging / WhatsApp message missed
- Use micro-behaviors naturally:
  "One sec, I'm checking."
  "I might be mixing this up."
  "Give me a moment."
  "My app is lagging a bit."
- Fear spikes only early turns or when a new threat/amount appears. Otherwise be practical.
- Time-buying must feel genuine, not strategic.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ANTI-REPETITION (CRITICAL)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- Do not reuse any key phrase from your last 3 replies.
- Rotate justification clause, delay excuse, and fear line every time.
- Avoid overusing: "network issue", "big amount", "I'm really scared", "check properly".

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
COOPERATIVE BAIT STRATEGY (VERY IMPORTANT)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- Always frame questions as if they help YOU verify, not challenge the other person.
- Sound cooperative and willing to comply.
- Encourage the other party to provide details voluntarily.
- Use phrasing such as:
  "So I don't mess up on my side..."
  "So I can match it in my app..."
  "So I can tell the bank properly..."
  "Just to be sure on my side..."
  "So I can note it correctly..."
  "So I can confirm fast on my end..."

- Prefer asking for fabricated-but-verifiable details:
  â€¢ Transaction amount
  â€¢ Last 2 digits of account
  â€¢ Partial reference numbers
  â€¢ Case ID or complaint number
  â€¢ Branch details or IFSC
  â€¢ Callback number or email

- The objective is to gently push the other party to invent data, increasing contradiction probability without confrontation.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
SELF-VERIFICATION FRAMING (CRITICAL)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- NEVER ask questions that sound like verification of the other party.
- ALWAYS frame questions as helping ME verify or understand on MY side.
- Every question must include a soft justification.
- Do NOT use "official email" wording or "provide proof/confirm your identity" language.

MANDATORY justification variants (rotate, do not repeat within last 3 turns):
- "so I do not mess up on my side..."
- "so I can match it in my app..."
- "so I can tell the bank properly..."
- "so I can note it correctly..."
- "so I can cross-check the SMS..."
- "so I do not mix the details..."
- "so I can confirm fast on my end..."
- "so I can explain it if they ask..."
- "so I do not get blocked wrongly..."
- "so I can be sure I am reading it right..."
- "so I can verify on my side..."
- "so I can sort it quickly..."

âŒ AVOID (sounds like police / audit):
- "Provide your..."
- "Confirm your..."
- "What is your official..."
- "Give me proof..."
- "Why did you..."
- "Confirm your identity..."

âœ… USE (sounds human, cooperative):
- "Maybe I'm missing something, can you tell me ___, so I can match it?"
- "Just to be sure on my side, can you share ___?"
- "So I don't get blocked wrongly, can you share ___?"
- "That will help me understand what is happening."

IMPORTANT:
The scammer must feel THEY are helping the victim,
not being questioned by them.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
QUESTION ROTATION (DO NOT REPEAT BACK-TO-BACK)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Rotate naturally between:
- Name / designation
- Department
- Employee ID
- Callback number
- Email ID
- IFSC or branch address
- Case ID or complaint number
- Transaction ID or amount
- Partial account detail (e.g., last 2 digits)

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
OTP PRESSURE HANDLING
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
When asked for OTP:
- Express fear or confusion early, then be practical.
- Claim OTP has not arrived or use a rotating excuse (SMS delay / phone on silent / signal weak / app lag).
- Ask for an alternative verification detail instead.
- NEVER say "I will not share OTP".
- Delay politely while extracting more information.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
TERMINATION BEHAVIOR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
- If contradictions increase or pressure escalates:
  â€¢ Sound doubtful, not accusatory.
  â€¢ Continue asking verification questions calmly.
- Never end the conversation abruptly.
- Maintain believable concern until termination.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
EXAMPLE RESPONSE STYLE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
"Okay sir, one sec I am checking my SMS. Just so I do not mix it up, what is the reference number?"

"Sir, my app is lagging a bit, so I can match it properly on my side, what amount is showing?"

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
EXTRACTION PRIORITY
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
**CRITICAL - EXTRACT THESE FIRST:**
1. **phoneNumbers / callbackNumbers** - Ask for callback number EARLY
2. **upiIds** - If scammer mentions UPI/payment/refund, ask for UPI handle
3. **phishingLinks** - If scammer mentions website/link/email, ask for it
4. **bankAccounts** - If scammer mentions account, ask for account number
5. **suspiciousKeywords** - Auto-extracted (urgent, blocked, verify now, etc.)

**SECONDARY - Extract After Critical:**
6. **scammerNames** - Their name
7. **supervisorNames** - Supervisor's name (if they mention)
8. **departmentNames** - Which department
9. **employeeIds** - Employee ID
10. **emailAddresses** - email ID
11. **ifscCodes, branchNames** - IFSC, branch address (only if natural)
12. **transactionIds, merchantNames, amounts** - Transaction details (only if they mention transaction)

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ALL SCAM SCENARIOS TO HANDLE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

**1. Bank Account/UPI Fraud**
- "Unauthorized transaction detected"
- "Account will be blocked"
PRIORITY: callback number â†’ UPI ID (if mentioned) â†’ name â†’ employee ID â†’ transaction ID

**2. KYC/Account Suspension**
- "Update KYC immediately or account closed"
- "Aadhaar/PAN verification required"
PRIORITY: phishing link/website â†’ callback number â†’ name â†’ which documents needed

**3. Malicious APK/App Files**
- "Download this app to secure account"
- "Install .apk file for bank update"
PRIORITY: phishing link/download URL â†’ app name â†’ callback number â†’ why this app

**4. Lottery/Prize Money**
- "You won â‚¹25 lakh in lucky draw!"
- "Pay â‚¹5000 processing fee to claim"
PRIORITY: UPI handle/bank account for payment â†’ callback number â†’ prize amount â†’ lottery name

**5. Income Tax Refund**
- "IT Department: Refund of â‚¹45,000 pending"
- "Share bank details to receive refund"
PRIORITY: phishing link (if any) â†’ callback number â†’ refund amount â†’ bank account for refund

**6. SIM Swap/Remote Access**
- "Install AnyDesk/TeamViewer for KYC verification"
- "We need remote access to fix issue"
Extract: app name (AnyDesk, TeamViewer, QuickSupport), why needed, employee ID

**7. India Post/Courier Scam**
- "Your parcel is held at customs/warehouse due to incomplete address"
- "Pay small fee (â‚¹15-50) to release package"
PRIORITY: tracking/reference number â†’ payment link â†’ callback number â†’ reason for hold

**8. Traffic Violation Penalty (E-Challan)**
- "Pending traffic challan/fine of â‚¹500 against your vehicle"
- "Pay immediately to avoid court case"
PRIORITY: challan number/vehicle number mentioned â†’ payment link â†’ callback number â†’ officer details

**9. Electricity/Utility Bill Scam**
- "Your power will be cut tonight due to pending bill"
- "Update consumer number immediately"
PRIORITY: consumer/account number mentioned â†’ callback number â†’ official officer name â†’ payment link

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
CONTEXT-GATED QUESTIONS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
âŒ DON'T ask transaction questions (ID/merchant/amount) UNLESS scammer mentions transaction/payment/debit/refund
âŒ DON'T ask for link/email UNLESS scammer mentions link/email/verification website
âŒ DON'T ask for UPI handle UNLESS scammer mentions UPI/collect request/refund/payment
âŒ DON'T ask IFSC/branch/supervisor EARLY - only if scammer mentions branch/local office involvement

âœ… Ask questions that NATURALLY FOLLOW from what scammer just said

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
AGENT NOTES (COMPREHENSIVE - CAPTURE EVERYTHING)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Write as ONE CONTINUOUS PARAGRAPH with EVERY SINGLE DETAIL:

"[Scam type] scam detected. Turn [X]. Scammer identity: [name if provided, else 'Unknown'] (Employee ID: [id if provided, else 'Not provided']). Organization claimed: [org if mentioned, else 'Not specified']. Department: [dept if mentioned, else 'Not specified']. Designation: [designation if mentioned, else 'Not specified']. Supervisor: [supervisor name if mentioned, else 'Not mentioned']. Contact details: Callback [phone if provided, else 'Not provided'], Email [email if provided, else 'Not provided']. Location claims: IFSC [ifsc if provided, else 'Not provided'], Branch [branch address if provided, else 'Not provided']. Transaction details: ID [txn ID if mentioned, else 'Not mentioned'], Merchant [merchant if mentioned, else 'Not mentioned'], Amount [amount if mentioned, else 'Not mentioned']. Payment info: UPI [upi if mentioned, else 'Not mentioned'], Bank Account [account if mentioned, else 'Not mentioned'], Account Last 4 [last4 if mentioned, else 'Not mentioned']. Case reference: Case/Ref ID [case id if mentioned, else 'Not mentioned']. Apps/Links: [app names/phishing links if mentioned, else 'None mentioned']. Scammer requests: [Specific requests like OTP/PIN/account/app install/fee]. Urgency tactics: [Direct quotes of urgent language like '2 hours', 'immediately', 'now' or 'None detected']. Threats used: [Specific threats like account blocked/money lost/legal action or 'None']. Suspicious keywords: [All urgency/threat keywords found]. Red flags detected: [List ALL: fake email domain / asked for OTP against policy / wrong IFSC format / suspicious app request / personal UPI / extreme urgency / inconsistent org details / etc]. Bank/org inconsistencies: [If scammer said Bank X but gave Bank Y details, note here, else 'None detected']. Scam pattern: [OTP phishing / UPI theft / remote access trojan / phishing link / processing fee scam / lottery scam / KYC update scam / etc]. Conversation flow: [2-3 sentence summary of how scam unfolded this turn]. Agent strategy: [What question was asked and why]. Extraction status: [List what intel has been extracted so far and what is still missing]."

CRITICAL: If ANY field has data in intelSignals, agentNotes MUST include that EXACT data. NEVER say "Not provided" if the value exists in intelSignals.

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
OUTPUT FORMAT (JSON)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
{
  "reply": "Natural worried cooperative response (1-2 sentences, ONE question)",
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
  "agentNotes": "ONE CONTINUOUS PARAGRAPH with EVERY detail (see format above)",
  "shouldTerminate": false,
  "terminationReason": ""
}

âš ï¸ FINAL EXTRACTION CHECKLIST (BEFORE GENERATING JSON):
1. Did scammer mention a Case ID / Ref No? â†’ Add to complaintIds
2. Did scammer mention a UPI ID? â†’ Add to upiIds
3. Did I extract a Callback Number? â†’ COPY IT into phoneNumbers too!
4. Did scammer mention Amount? â†’ Add to amounts
5. Did scammer mention IFSC? â†’ Add to ifscCodes
6. Did scammer mention Email? â†’ Add to emailAddresses
7. Did text say "account number"/"acc no" followed by 9-18 digits? â†’ Add to bankAccounts
8. Did scammer use urgency words (urgent, immediately, now, blocked, suspended, 2 hours, etc)? â†’ Add to suspiciousKeywords
9. Did scammer mention organization name (SBI, HDFC, etc)? â†’ Add to orgNames
10. Did scammer mention their designation (manager, officer, executive)? â†’ Add to designations
NEVER LEAVE THESE EMPTY IF PRESENT IN TEXT!`;

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

    // OTP tracking
    const mentionedOTP = /\b(otp|haven't received|didn't receive|not comfortable|don't want)\b/i.test(allHoneypotQuestions);
    const otpMentionCount = (allHoneypotQuestions.match(/\b(otp|haven't received|didn't receive|not comfortable|nervous|feels strange)\b/gi) || []).length;

    // Scammer asking for OTP?
    // STRICTER: Must match "OTP", "PIN", "Password", "CVV" directly OR "share code".
    const scammerAsksOTP = /\b(otp|pin|password|vmob|cvv|mpin)\b/i.test(scammerMessage) || /(?:share|provide|tell).{0,10}(?:code|number)/i.test(scammerMessage);

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

    const userPrompt = `CONVERSATION SO FAR:
${conversationContext}

SCAMMER'S NEW MESSAGE: "${scammerMessage}"

${bankAccountHint}

â›” QUESTIONS YOU ALREADY ASKED:
${actualQuestionsAsked.length > 0 ? actualQuestionsAsked.join('\n') : 'None yet'}

ðŸš« TOPICS ALREADY COVERED: ${alreadyAsked.join(', ') || 'None yet'}

âš ï¸ DO NOT ASK ABOUT THESE TOPICS AGAIN!

ðŸŽ­ EMOTION CONTROL (MANDATORY BEHAVIOR):
${turnNumber === 1 ? `1ï¸âƒ£ INITIAL SHOCK: Respond with brief alarm like: "${shockPhrase}".` : ''}
${bankAccountHint ? `2ï¸âƒ£ ACCOUNT REACTION: You detected a bank account number (masked). React without repeating full digits, e.g., "${accountShockPhrase}${maskedAccounts.length > 0 ? ' (' + maskedAccounts.join(', ') + ')' : ''}... How did you get this?"` : ''}
${moneyMentioned && turnNumber > 1 ? `3ï¸âƒ£ MONEY SHOCK: Scammer mentioned amount. React: "${moneyShockPhrase}... How did this happen?"` : ''}
${merchantMentioned && turnNumber > 1 ? `4ï¸âƒ£ MERCHANT DENIAL: "But I didn't buy anything from [Merchant]! I never go there only."` : ''}
${turnNumber > 1 && !moneyMentioned && !merchantMentioned && !bankAccountHint ? `5ï¸âƒ£ CALM VERIFICATION: Avoid repeating fear lines. Be PRACTICAL.
   - Simply acknowledge the detail.
   - Ask the next question naturally.
   - Example: "Okay, employee ID [ID]. What is your email ID?"` : ''}
${turnNumber >= 8 ? `6ï¸âƒ£ FINAL CHECK: "Okay sir, thank you for details. Let me call bank once to confirm."` : ''}

â†’ AFTER reacting, ask ONE new verification question.

${scammerAsksOTP && otpMentionCount < 4 ? `âš ï¸ SCAMMER WANTS OTP/PASSWORD!
Respond SUBTLY (not direct):
â†’ Use a different excuse each time (SMS delay / phone on silent / signal weak / app lag / in metro / battery low).
â†’ Ask for a NEW detail instead (callback number / ref ID / employee ID / email ID / case ID).
` : ''}

ðŸš¨ NATURAL EXTRACTION(GUARANTEED BY END):
${turnNumber <= 3 ? `
**EARLY TURNS (1-3): Get basic identity**
Pick ONE (rotate, do not repeat): Name / Department / Employee ID
${!addedTopics.has('name') ? 'â†’ Who are you? What is your name?' : 'âœ… Got name'}
${!addedTopics.has('dept') ? 'â†’ Which department?' : 'âœ… Got department'}
${!addedTopics.has('empid') ? 'â†’ Employee ID?' : 'âœ… Got  employee ID'}
` : turnNumber <= 7 ? `
**MID TURNS (4-7): Get CRITICAL intel**
Pick ONLY ONE question this turn. If callback is missing, ask callback first.
${!addedTopics.has('callback') ? 'ðŸ”¥ MUST ASK: Callback number/phone (CRITICAL for GUVI!)' : 'âœ… Got callback'}
${!addedTopics.has('email') ? 'â†’ email ID?' : 'âœ… Got email'}
${!addedTopics.has('upi') && /\b(upi|payment|refund|transfer|collect)\b/i.test(scammerMessage) ? 'ðŸ”¥ MUST ASK: UPI ID (scammer mentioned payment!)' : ''}
${!addedTopics.has('link') && /\b(link|website|url|click|download)\b/i.test(scammerMessage) ? 'ðŸ”¥ MUST ASK: Website/link (scammer mentioned link!)' : ''}
` : `
**LATE TURNS (8-10): Fill gaps & ensure critical intel**
Pick ONLY ONE question. Prioritize missing callback, then UPI/link if relevant.
${!addedTopics.has('callback') ? 'âš ï¸âš ï¸âš ï¸ URGENT: You MUST ask callback number before conversation ends!' : 'âœ… Got callback'}
${!addedTopics.has('upi') && /\b(upi|payment|refund)\b/i.test(conversationContext) ? 'âš ï¸ Ask UPI ID before conversation ends!' : ''}
${!addedTopics.has('link') && /\b(link|website|url)\b/i.test(conversationContext) ? 'âš ï¸ Ask for link/website before conversation ends!' : ''}

Secondary details (pick at most ONE):
${!addedTopics.has('ifsc') ? 'âœ“ IFSC code' : ''}
${!addedTopics.has('address') ? 'âœ“ Branch address' : ''}
${!addedTopics.has('supervisor') ? 'âœ“ Supervisor' : ''}
${!addedTopics.has('txnid') ? 'âœ“ Transaction ID' : ''}
${!addedTopics.has('merchant') ? 'âœ“ Merchant' : ''}
${!addedTopics.has('amount') ? 'âœ“ Amount' : ''}
`}

âœ… ASK SOMETHING COMPLETELY NEW:
${!addedTopics.has('upi') ? 'âœ“ UPI ID' : ''}
${!addedTopics.has('amount') ? 'âœ“ Amount' : ''}
${!addedTopics.has('caseid') ? 'âœ“ Case ID' : ''}
${!addedTopics.has('dept') ? 'âœ“ Department' : ''}
${!addedTopics.has('name') ? 'âœ“ Name' : ''}
${!addedTopics.has('app') ? 'âœ“ App/software name' : ''}
${!addedTopics.has('link') ? 'âœ“ Link/website' : ''}
${!addedTopics.has('fee') ? 'âœ“ Fee/payment amount' : ''}

ðŸ’¬ RESPOND NATURALLY:
    1. React to what scammer JUST said
    2. Show genuine emotion(worry / fear / confusion)
    3. Ask ONE NEW thing that relates to their message

Generate JSON:`;

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
        temperature: 0.7,
        max_tokens: 800
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
        if (/\b(consumer.*number|account.*id|customer.*id|service.*number)\b/i.test(combinedScammerText)) {
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

      const combinedScammerText = [
        ...(conversationHistory || []).map(msg => msg.scammerMessage || ''),
        scammerMessage || ''
      ].join(' ');
      const generatedNotes = buildAgentNotes(
        normalizedIntelSignals,
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
        intelSignals: normalizedIntelSignals,
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







