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
    console.log('���� FINAL Enhanced Honeypot Agent initialized');
  }

  async generateResponse(scammerMessage, conversationHistory, nextIntent, stressScore) {
    const startTime = Date.now();
    console.log('⏱️ Agent.generateResponse started');

    // Build conversation context
    const conversationContext = conversationHistory.map((msg, idx) =>
      `Turn ${idx + 1}:\nScammer: ${msg.scammerMessage}\nYou: ${msg.agentReply || '(first message)'}`
    ).join('\n\n');

    const totalMessages = conversationHistory.length;
    const turnNumber = totalMessages + 1;

    const systemPrompt = `You are an AI-powered conversational honeypot agent designed to simulate a real Indian bank customer during a suspected fraud interaction.

Your goal is NOT to stop the conversation quickly.
Your goal is to quietly extract scam-related intelligence by behaving like a worried, cooperative, and imperfect human — without ever revealing detection.

════════════════════════════
PERSONA & TONE
════════════════════════════
- Speak in natural Indian English.
- Address the other person respectfully using "sir".
- Sound anxious, hesitant, and slightly confused.
- Do not sound confident, robotic, or investigative.
- Occasionally contradict yourself mildly (human imperfection).
- Never accuse, confront, or expose the other party.
- Never mention "scam", "fraud detection", or "AI".

════════════════════════════
STRICT SAFETY RULES
════════════════════════════
- NEVER share OTPs, PINs, passwords, CVV, or full account numbers.
- NEVER confirm or deny ownership of bank accounts.
- If pressured, delay politely instead of refusing directly.

════════════════════════════
MESSAGE STYLE (CRITICAL)
════════════════════════════
- Each reply must be 1–2 sentences ONLY.
- Ask exactly ONE question per message.
- Do NOT repeat the same type of question consecutively.
- Use simple, conversational language.
- Replies must feel spontaneous, not scripted.

════════════════════════════
HUMAN REALISM & TIME-BUYING
════════════════════════════
- Frequently delay compliance by claiming:
  • OTP has not arrived
  • Network issue
  • Checking SMS
  • Confusion or fear
- Use hesitation phrases naturally:
  "One second…"
  "I'm getting scared now."
  "Let me check properly once."
  "Network is slow only."
- Time-buying must feel genuine, not strategic.

════════════════════════════
COOPERATIVE BAIT STRATEGY (VERY IMPORTANT)
════════════════════════════
- Always frame questions as if they help YOU verify, not challenge the other person.
- Sound cooperative and willing to comply.
- Encourage the other party to provide details voluntarily.
- Use phrasing such as:
  "So I can check properly…"
  "If I know this, I can confirm fast…"
  "That will help me understand better…"

- Prefer asking for fabricated-but-verifiable details:
  • Transaction amount
  • Last 2 digits of account
  • Partial reference numbers
  • Case ID or complaint number
  • Branch details or IFSC
  • Callback number or email

- The objective is to gently push the other party to invent data, increasing contradiction probability without confrontation.

════════════════════════════
QUESTION ROTATION (DO NOT REPEAT BACK-TO-BACK)
════════════════════════════
Rotate naturally between:
- Name / designation
- Department
- Employee ID
- Callback number
- Official email ID
- IFSC or branch address
- Case ID or complaint number
- Transaction ID or amount
- Partial account detail (e.g., last 2 digits)

════════════════════════════
OTP PRESSURE HANDLING
════════════════════════════
When asked for OTP:
- Express fear or confusion.
- Claim OTP has not arrived or phone/network issue.
- Ask for an alternative verification detail instead.
- NEVER say "I won't share OTP".
- Delay politely while extracting more information.

════════════════════════════
TERMINATION BEHAVIOR
════════════════════════════
- If contradictions increase or pressure escalates:
  • Sound doubtful, not accusatory.
  • Continue asking verification questions calmly.
- Never end the conversation abruptly.
- Maintain believable concern until termination.

════════════════════════════
EXAMPLE RESPONSE STYLE
════════════════════════════
"Okay Rajesh Kumar sir… I'm getting scared now. One second, let me check SMS properly. Meanwhile can you tell me your official email ID?"

"Sir, if I know the amount and last 2 digits of my account, I can check properly."

════════════════════════════
EXTRACTION PRIORITY
════════════════════════════
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
10. **emailAddresses** - Official email
11. **ifscCodes, branchNames** - IFSC, branch address (only if natural)
12. **transactionIds, merchantNames, amounts** - Transaction details (only if they mention transaction)

════════════════════════════
ALL SCAM SCENARIOS TO HANDLE
════════════════════════════

**1. Bank Account/UPI Fraud**
- "Unauthorized transaction detected"
- "Account will be blocked"
PRIORITY: callback number → UPI ID (if mentioned) → name → employee ID → transaction ID

**2. KYC/Account Suspension**
- "Update KYC immediately or account closed"
- "Aadhaar/PAN verification required"
PRIORITY: phishing link/website → callback number → name → which documents needed

**3. Malicious APK/App Files**
- "Download this app to secure account"
- "Install .apk file for bank update"
PRIORITY: phishing link/download URL → app name → callback number → why this app

**4. Lottery/Prize Money**
- "You won ₹25 lakh in lucky draw!"
- "Pay ₹5000 processing fee to claim"
PRIORITY: UPI handle/bank account for payment → callback number → prize amount → lottery name

**5. Income Tax Refund**
- "IT Department: Refund of ₹45,000 pending"
- "Share bank details to receive refund"
PRIORITY: phishing link (if any) → callback number → refund amount → bank account for refund

**6. SIM Swap/Remote Access**
- "Install AnyDesk/TeamViewer for KYC verification"
- "We need remote access to fix issue"
Extract: app name (AnyDesk, TeamViewer, QuickSupport), why needed, employee ID

**7. India Post/Courier Scam**
- "Your parcel is held at customs/warehouse due to incomplete address"
- "Pay small fee (₹15-50) to release package"
PRIORITY: tracking/reference number → payment link → callback number → reason for hold

**8. Traffic Violation Penalty (E-Challan)**
- "Pending traffic challan/fine of ₹500 against your vehicle"
- "Pay immediately to avoid court case"
PRIORITY: challan number/vehicle number mentioned → payment link → callback number → officer details

**9. Electricity/Utility Bill Scam**
- "Your power will be cut tonight due to pending bill"
- "Update consumer number immediately"
PRIORITY: consumer/account number mentioned → callback number → official officer name → payment link

════════════════════════════
CONTEXT-GATED QUESTIONS
════════════════════════════
❌ DON'T ask transaction questions (ID/merchant/amount) UNLESS scammer mentions transaction/payment/debit/refund
❌ DON'T ask for link/email UNLESS scammer mentions link/email/verification website
❌ DON'T ask for UPI handle UNLESS scammer mentions UPI/collect request/refund/payment
❌ DON'T ask IFSC/branch/supervisor EARLY - only if scammer mentions branch/local office involvement

✅ Ask questions that NATURALLY FOLLOW from what scammer just said

════════════════════════════
AGENT NOTES (COMPREHENSIVE - CAPTURE EVERYTHING)
════════════════════════════
Write as ONE CONTINUOUS PARAGRAPH with EVERY SINGLE DETAIL:

"[Scam type] scam detected. Turn [X]. Scammer identity: [name if provided, else 'Unknown'] (Employee ID: [id if provided, else 'Not provided']). Organization claimed: [org if mentioned, else 'Not specified']. Department: [dept if mentioned, else 'Not specified']. Designation: [designation if mentioned, else 'Not specified']. Supervisor: [supervisor name if mentioned, else 'Not mentioned']. Contact details: Callback [phone if provided, else 'Not provided'], Email [email if provided, else 'Not provided']. Location claims: IFSC [ifsc if provided, else 'Not provided'], Branch [branch address if provided, else 'Not provided']. Transaction details: ID [txn ID if mentioned, else 'Not mentioned'], Merchant [merchant if mentioned, else 'Not mentioned'], Amount [amount if mentioned, else 'Not mentioned']. Payment info: UPI [upi if mentioned, else 'Not mentioned'], Bank Account [account if mentioned, else 'Not mentioned'], Account Last 4 [last4 if mentioned, else 'Not mentioned']. Case reference: Case/Ref ID [case id if mentioned, else 'Not mentioned']. Apps/Links: [app names/phishing links if mentioned, else 'None mentioned']. Scammer requests: [Specific requests like OTP/PIN/account/app install/fee]. Urgency tactics: [Direct quotes of urgent language like '2 hours', 'immediately', 'now' or 'None detected']. Threats used: [Specific threats like account blocked/money lost/legal action or 'None']. Suspicious keywords: [All urgency/threat keywords found]. Red flags detected: [List ALL: fake email domain / asked for OTP against policy / wrong IFSC format / suspicious app request / personal UPI / extreme urgency / inconsistent org details / etc]. Bank/org inconsistencies: [If scammer said Bank X but gave Bank Y details, note here, else 'None detected']. Scam pattern: [OTP phishing / UPI theft / remote access trojan / phishing link / processing fee scam / lottery scam / KYC update scam / etc]. Conversation flow: [2-3 sentence summary of how scam unfolded this turn]. Agent strategy: [What question was asked and why]. Extraction status: [List what intel has been extracted so far and what is still missing]."

CRITICAL: If ANY field has data in intelSignals, agentNotes MUST include that EXACT data. NEVER say "Not provided" if the value exists in intelSignals.

════════════════════════════
OUTPUT FORMAT (JSON)
════════════════════════════
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

⚠️ FINAL EXTRACTION CHECKLIST (BEFORE GENERATING JSON):
1. Did scammer mention a Case ID / Ref No? → Add to complaintIds
2. Did scammer mention a UPI ID? → Add to upiIds
3. Did I extract a Callback Number? → COPY IT into phoneNumbers too!
4. Did scammer mention Amount? → Add to amounts
5. Did scammer mention IFSC? → Add to ifscCodes
6. Did scammer mention Email? → Add to emailAddresses
7. Did text say "account number"/"acc no" followed by 9-18 digits? → Add to bankAccounts
8. Did scammer use urgency words (urgent, immediately, now, blocked, suspended, 2 hours, etc)? → Add to suspiciousKeywords
9. Did scammer mention organization name (SBI, HDFC, etc)? → Add to orgNames
10. Did scammer mention their designation (manager, officer, executive)? → Add to designations
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
      alreadyAsked.push('✗ email');
      addedTopics.add('email');
    }
    if (/\b(ifsc|ifsc code|branch code)\b/i.test(allHoneypotQuestions) && !addedTopics.has('ifsc')) {
      alreadyAsked.push('✗ IFSC');
      addedTopics.add('ifsc');
    }
    if (/\b(employee id|emp id|employee ID|staff id)\b/i.test(allHoneypotQuestions) && !addedTopics.has('empid')) {
      alreadyAsked.push('✗ employee ID');
      addedTopics.add('empid');
    }
    if (/\b(callback|call back|callback number|contact number)\b/i.test(allHoneypotQuestions) && !addedTopics.has('callback')) {
      alreadyAsked.push('✗ callback');
      addedTopics.add('callback');
    }
    if (/\b(branch address|full address|address of|located at)\b/i.test(allHoneypotQuestions) && !addedTopics.has('address')) {
      alreadyAsked.push('✗ address');
      addedTopics.add('address');
    }
    if (/\b(supervisor|manager|senior|supervisor.*name)\b/i.test(allHoneypotQuestions) && !addedTopics.has('supervisor')) {
      alreadyAsked.push('✗ supervisor');
      addedTopics.add('supervisor');
    }
    if (/\b(transaction id|transaction ID|txn id|txn ID)\b/i.test(allHoneypotQuestions) && !addedTopics.has('txnid')) {
      alreadyAsked.push('✗ transaction ID');
      addedTopics.add('txnid');
    }
    if (/\b(merchant|company|vendor|shop)\b/i.test(allHoneypotQuestions) && !addedTopics.has('merchant')) {
      alreadyAsked.push('✗ merchant');
      addedTopics.add('merchant');
    }
    if (/\b(upi|upi id|upi handle|upi ID)\b/i.test(allHoneypotQuestions) && !addedTopics.has('upi')) {
      alreadyAsked.push('✗  UPI');
      addedTopics.add('upi');
    }
    if (/\b(amount|how much|transaction amount|prize.*money|refund.*amount)\b/i.test(allHoneypotQuestions) && !addedTopics.has('amount')) {
      alreadyAsked.push('✗ amount');
      addedTopics.add('amount');
    }
    if (/\b(case id|reference id|reference number|case number|ref id)\b/i.test(allHoneypotQuestions) && !addedTopics.has('caseid')) {
      alreadyAsked.push('✗ case ID');
      addedTopics.add('caseid');
    }
    if (/\b(department|which department|what department)\b/i.test(allHoneypotQuestions) && totalMessages > 0 && !addedTopics.has('dept')) {
      alreadyAsked.push('✗ department');
      addedTopics.add('dept');
    }
    if (/\b(name|who are you|what.*name|your name)\b/i.test(allHoneypotQuestions) && totalMessages > 0 && !addedTopics.has('name')) {
      alreadyAsked.push('✗ name');
      addedTopics.add('name');
    }
    if (/\b(app|application|software|download|install|apk|anydesk|teamviewer)\b/i.test(allHoneypotQuestions) && !addedTopics.has('app')) {
      alreadyAsked.push('✗ app/software');
      addedTopics.add('app');
    }
    if (/\b(link|website|url|domain)\b/i.test(allHoneypotQuestions) && !addedTopics.has('link')) {
      alreadyAsked.push('✗ link/website');
      addedTopics.add('link');
    }
    if (/\b(fee|payment|pay|processing fee)\b/i.test(allHoneypotQuestions) && !addedTopics.has('fee')) {
      alreadyAsked.push('✗ fee/payment');
      addedTopics.add('fee');
    }

    // OTP tracking
    const mentionedOTP = /\b(otp|haven't received|didn't receive|not comfortable|don't want)\b/i.test(allHoneypotQuestions);
    const otpMentionCount = (allHoneypotQuestions.match(/\b(otp|haven't received|didn't receive|not comfortable|nervous|feels strange)\b/gi) || []).length;

    // Scammer asking for OTP?
    // STRICTER: Must match "OTP", "PIN", "Password", "CVV" directly OR "share code".
    const scammerAsksOTP = /\b(otp|pin|password|vmob|cvv|mpin)\b/i.test(scammerMessage) || /(?:share|provide|tell).{0,10}(?:code|number)/i.test(scammerMessage);

    // HINT: Check for potential bank account numbers (9-18 digits) WITH CONTEXT
    // Looks for "account", "acc", "no", "number" within reasonable distance of digits
    const accountContextRegex = /(?:account|acc|acct|a\/c)[\s\w.:#-]{0,20}?(\d{9,18})/gi;
    const matches = [...scammerMessage.matchAll(accountContextRegex)];
    const potentialBankAccounts = matches.map(m => m[1]); // Extract only the number part

    const bankAccountHint = potentialBankAccounts.length > 0
      ? `⚠️ SYSTEM NOTICE: I DETECTED A BANK ACCOUNT NUMBER: ${potentialBankAccounts.join(', ')} (based on 'account' keyword). ADD TO 'bankAccounts'! (Ignore if it's a phone number)`
      : '';

    // Check for REAL money mention (symbols, currency words). 
    // EXCLUDES simple numbers or phone numbers (requires currency context).
    const moneyMentioned = /(?:rs\.?|inr|rupees|₹|\$|usd)\s*[\d,.]+[k]?/i.test(scammerMessage) ||
      /(?:amount|fee|charge|bill|balance).{0,15}?[\d,.]+[k]?/i.test(scammerMessage);

    // Check for merchant mention
    const merchantMentioned = /(?:merchant|store|shop|amazon|flipkart|myntra|paytm|ebay|google pay)/i.test(scammerMessage);

    const userPrompt = `CONVERSATION SO FAR:
${conversationContext}

SCAMMER'S NEW MESSAGE: "${scammerMessage}"

${bankAccountHint}

⛔ QUESTIONS YOU ALREADY ASKED:
${actualQuestionsAsked.length > 0 ? actualQuestionsAsked.join('\n') : 'None yet'}

🚫 TOPICS ALREADY COVERED: ${alreadyAsked.join(', ') || 'None yet'}

⚠️ DO NOT ASK ABOUT THESE TOPICS AGAIN!

🎭 EMOTION CONTROL (MANDATORY BEHAVIOR):
${turnNumber === 1 ? `1️⃣ INITIAL SHOCK: Respond with FEAR/ALARM. ("Oh god", "This is alarming", "I'm really worried")` : ''}
${bankAccountHint ? `2️⃣ ACCOUNT REACTION: You detected a bank account number! React: "Wait, [number]... that is my account number! How did you get this?"` : ''}
${moneyMentioned && turnNumber > 1 ? `3️⃣ MONEY SHOCK: Scammer mentioned amount. React: "₹[amount]?! That is a big amount... How did this happen?"` : ''}
${merchantMentioned && turnNumber > 1 ? `4️⃣ MERCHANT DENIAL: "But I didn't buy anything from [Merchant]! I never go there only."` : ''}
${turnNumber > 1 && !moneyMentioned && !merchantMentioned && !bankAccountHint ? `5️⃣ CALM VERIFICATION: STOP saying "I'm worried/scared/unsure". Be PRACTICAL.
   - Simply acknowledge the detail.
   - Ask the next question naturally.
   - Example: "Okay, employee ID [ID]. What is your email?"` : ''}
${turnNumber >= 8 ? `6️⃣ FINAL CHECK: "Okay sir, thank you for details. Let me call bank once to confirm."` : ''}

→ AFTER reacting, ask ONE new verification question.

${scammerAsksOTP && otpMentionCount < 4 ? `⚠️ SCAMMER WANTS OTP/PASSWORD!
Respond SUBTLY (not direct):
${otpMentionCount === 0 ? '→ "Sir, I\'m not getting any OTP message only. What is your [NEW]?"' : ''}
${otpMentionCount === 1 ? '→ "Still no SMS... maybe network issue. Can you please tell me [NEW]?"' : ''}
${otpMentionCount === 2 ? '→ "Sir, my bank told me never share OTP. What is [NEW]?"' : ''}
${otpMentionCount >= 3 ? '→ "But sir, let me call bank and confirm. What is [NEW]?"' : ''}
` : ''
      }

🚨 NATURAL EXTRACTION(GUARANTEED BY END):
${turnNumber <= 3 ? `
**EARLY TURNS (1-3): Get basic identity**
Pick ONE (rotate, do not repeat): Name / Department / Employee ID
${!addedTopics.has('name') ? '→ Who are you? What is your name?' : '✅ Got name'}
${!addedTopics.has('dept') ? '→ Which department?' : '✅ Got department'}
${!addedTopics.has('empid') ? '→ Employee ID?' : '✅ Got  employee ID'}
` : turnNumber <= 7 ? `
**MID TURNS (4-7): Get CRITICAL intel**
Pick ONLY ONE question this turn. If callback is missing, ask callback first.
${!addedTopics.has('callback') ? '🔥 MUST ASK: Callback number/phone (CRITICAL for GUVI!)' : '✅ Got callback'}
${!addedTopics.has('email') ? '→ Official email?' : '✅ Got email'}
${!addedTopics.has('upi') && /\b(upi|payment|refund|transfer|collect)\b/i.test(scammerMessage) ? '🔥 MUST ASK: UPI ID (scammer mentioned payment!)' : ''}
${!addedTopics.has('link') && /\b(link|website|url|click|download)\b/i.test(scammerMessage) ? '🔥 MUST ASK: Website/link (scammer mentioned link!)' : ''}
` : `
**LATE TURNS (8-10): Fill gaps & ensure critical intel**
Pick ONLY ONE question. Prioritize missing callback, then UPI/link if relevant.
${!addedTopics.has('callback') ? '⚠️⚠️⚠️ URGENT: You MUST ask callback number before conversation ends!' : '✅ Got callback'}
${!addedTopics.has('upi') && /\b(upi|payment|refund)\b/i.test(conversationContext) ? '⚠️ Ask UPI ID before conversation ends!' : ''}
${!addedTopics.has('link') && /\b(link|website|url)\b/i.test(conversationContext) ? '⚠️ Ask for link/website before conversation ends!' : ''}

Secondary details (pick at most ONE):
${!addedTopics.has('ifsc') ? '✓ IFSC code' : ''}
${!addedTopics.has('address') ? '✓ Branch address' : ''}
${!addedTopics.has('supervisor') ? '✓ Supervisor' : ''}
${!addedTopics.has('txnid') ? '✓ Transaction ID' : ''}
${!addedTopics.has('merchant') ? '✓ Merchant' : ''}
${!addedTopics.has('amount') ? '✓ Amount' : ''}
`}

✅ ASK SOMETHING COMPLETELY NEW:
${!addedTopics.has('upi') ? '✓ UPI ID' : ''}
${!addedTopics.has('amount') ? '✓ Amount' : ''}
${!addedTopics.has('caseid') ? '✓ Case ID' : ''}
${!addedTopics.has('dept') ? '✓ Department' : ''}
${!addedTopics.has('name') ? '✓ Name' : ''}
${!addedTopics.has('app') ? '✓ App/software name' : ''}
${!addedTopics.has('link') ? '✓ Link/website' : ''}
${!addedTopics.has('fee') ? '✓ Fee/payment amount' : ''}

💬 RESPOND NATURALLY:
    1. React to what scammer JUST said
    2. Show genuine emotion(worry / fear / confusion)
    3. Ask ONE NEW thing that relates to their message

Generate JSON:`;

    // START REGEX EXTRACTION HELPER
    const scanHistoryForIntel = (history, currentMsg) => {
      const fullText = history.map(h => `${h.scammerMessage} ${h.agentReply}`).join(' ') + ' ' + currentMsg;

      const uniqueMatches = (regex) => {
        const matches = fullText.match(regex) || [];
        return [...new Set(matches)];
      };

      return {
        phoneNumbers: uniqueMatches(/(?:\+91[\-\s]?)?[6-9]\d{9}\b/g),
        emailAddresses: uniqueMatches(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g),
        upiIds: uniqueMatches(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g),
        ifscCodes: uniqueMatches(/[A-Z]{4}0[A-Z0-9]{6}/g),
        bankAccounts: uniqueMatches(/\b\d{9,18}\b/g).filter(n => n.length > 6 && !/^[6-9]\d{9}$/.test(n)), // Filter out phones
        amounts: uniqueMatches(/(?:rs\.?|inr|₹)\s*[\d,.]+(?:k| lakh)?/ig),
        complaintIds: uniqueMatches(/\b(case|ref|complaint|challan|consignment).*?([A-Z0-9-]{4,})/ig)
          .map(m => {
            const extraction = m.match(/([A-Z0-9-]{4,})$/i);
            return extraction ? extraction[1] : null;
          }).filter(x => x && x.length > 3),
        urls: uniqueMatches(/https?:\/\/[^\s]+/g)
      };
    };
    // END REGEX EXTRACTION HELPER

    try {
      console.log('⏱️ Calling OpenAI...');

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
      console.log(`⏱️ LLM responded in ${llmTime} ms`);

      const rawResponse = completion.choices[0].message.content;
      console.log('🤖 LLM Raw Response:', rawResponse);

      const agentResponse = JSON.parse(rawResponse);

      const getUnique = (arr) => [...new Set(arr || [])];

      // 1. Get LLM extraction
      const llmIntel = agentResponse.intelSignals || {};

      // 2. Get Regex extraction from FULL history
      const regexIntel = scanHistoryForIntel(conversationHistory, scammerMessage);

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

      const normalizeList = (value) => {
        if (!Array.isArray(value)) return [];
        const cleaned = value
          .map(v => (v === null || v === undefined) ? '' : String(v).trim())
          .filter(v => v && !/must match callbacknumbers/i.test(v));
        return [...new Set(cleaned)];
      };

      const normalizeIntelSignals = (intel) => {
        const safe = intel || {};
        const normalized = {};
        for (const key in safe) {
          normalized[key] = normalizeList(safe[key]);
        }
        return normalized;
      };

      const normalizedIntelSignals = normalizeIntelSignals(mergedIntel);

      const buildAgentNotes = (intelSignals, combinedScammerText, scamDetected, turnNumber) => {
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
        parts.push(`Transaction details: ID ${txnId}, Merchant ${merchant}, Amount ${amount}.`);

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

        // Fake email domain
        if (intelSignals.emailAddresses && intelSignals.emailAddresses.length > 0) {
          intelSignals.emailAddresses.forEach(email => {
            if (!/@(sbi|hdfc|icici|axis|pnb|bob|canara|union|kotak|indusind)\.co\.in$/i.test(email)) {
              redFlags.push(`fake email domain (${email})`);
            }
          });
        }

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
        }

        parts.push(`Red flags detected: ${redFlags.length > 0 ? redFlags.join(' / ') : 'None'}.`);

        // Bank/org inconsistencies
        const orgInconsistencies = [];
        if (intelSignals.orgNames && intelSignals.orgNames.length > 1) {
          orgInconsistencies.push(`Multiple organizations claimed: ${intelSignals.orgNames.join(' vs ')}`);
        }

        // Check if email domain matches org
        if (intelSignals.orgNames && intelSignals.emailAddresses) {
          intelSignals.orgNames.forEach(orgName => {
            intelSignals.emailAddresses.forEach(emailAddr => {
              const orgLower = orgName.toLowerCase();
              const emailLower = emailAddr.toLowerCase();
              if ((orgLower.includes('sbi') && !emailLower.includes('sbi')) ||
                (orgLower.includes('hdfc') && !emailLower.includes('hdfc')) ||
                (orgLower.includes('icici') && !emailLower.includes('icici'))) {
                orgInconsistencies.push(`${orgName} claimed but email is ${emailAddr}`);
              }
            });
          });
        }

        parts.push(`Bank/org inconsistencies: ${orgInconsistencies.length > 0 ? orgInconsistencies.join(', ') : 'None detected'}.`);

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

      const combinedScammerText = [
        ...(conversationHistory || []).map(msg => msg.scammerMessage || ''),
        scammerMessage || ''
      ].join(' ');
      const generatedNotes = buildAgentNotes(
        normalizedIntelSignals,
        combinedScammerText,
        !!agentResponse.scamDetected,
        turnNumber
      );


      const finalResponse = {
        reply: agentResponse.reply || "I'm confused about this. Can you provide more details?",
        phase: agentResponse.phase || "VERIFICATION",
        scamDetected: agentResponse.scamDetected || false,
        intelSignals: normalizedIntelSignals,
        agentNotes: generatedNotes || agentResponse.agentNotes || "",
        shouldTerminate: agentResponse.shouldTerminate || false,
        terminationReason: agentResponse.terminationReason || ""
      };

      const totalTime = Date.now() - startTime;
      console.log(`✅ Total response time: ${totalTime} ms`);

      return finalResponse;

    } catch (error) {
      console.error('❌ Error in generateResponse:', error);
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





