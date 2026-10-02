const TRADE_JOURNEY = [
  {
    "id": "booking",
    "label": "Book the trade",
    "owner": "Trading + operations",
    "title": "Capture the agreement",
    "body": "The bank buys 1,000 Company A shares at $100 each in its Customer book. Booking records an agreement; it does not establish settlement or today's value.",
    "input": "Confirmed buy: 1,000 shares at $100",
    "output": "Trade T-1042 · Company A · USD · Customer book",
    "control": "Match instrument, direction, quantity, price, currency and settlement details to the confirmation.",
    "data": "TradeId → InstrumentId → BookId → LegalEntityId",
    "question": "Would a duplicate booking affect only cash?",
    "answer": "No. A duplicate can overstate both the position and expected cash. Reconcile trade IDs and confirmations.",
    "lesson": 17
  },
  {
    "id": "position",
    "label": "Build the position",
    "owner": "Position service + operations",
    "title": "Turn events into a holding",
    "body": "Assume the trade settled yesterday, with no other trades. A trade is an event; a position is a holding at a point in time.",
    "input": "One settled purchase; no sales or opening shares",
    "output": "+1,000 shares · cumulative net cash −$100,000",
    "control": "Reconcile quantities, settlement status and cash. Unsettled receivables/payables and corporate actions are outside this example.",
    "data": "Trade events + as-of time → position snapshot",
    "question": "Is the $100,000 payment a $100,000 loss?",
    "answer": "No. Cash was exchanged for an asset. At purchase, the holding value and cash paid offset in this economic calculation.",
    "lesson": 1
  },
  {
    "id": "market-data",
    "label": "Select prices",
    "owner": "Market data team + valuation users",
    "title": "Attach meaning to each price",
    "body": "At today's close the desk uses $104 per share. An independent quote is $103.50. Check instrument, currency, timestamp and quotation basis before comparison.",
    "input": "Desk mark $104.00 · independent quote $103.50",
    "output": "Two price records with source, time and quality evidence",
    "control": "Use the evidence switch below. Assume comparable close-time evidence in the usable case. A stale quote is not suitable merely because its provider is independent.",
    "data": "InstrumentId + price time + currency + source + basis",
    "question": "Does independent always mean correct and usable?",
    "answer": "No. Independence supports challenge, but freshness, relevance and comparability also matter.",
    "lesson": 3
  },
  {
    "id": "valuation",
    "label": "Calculate value",
    "owner": "Valuation engine + desk",
    "title": "Apply a price to the holding",
    "body": "For this simple cash equity, multiply shares by price. The resulting holding value is not its profit. The approved prior-day value was $100,000.",
    "input": "1,000 shares × desk mark $104",
    "output": "Desk value $104,000 · candidate independent value $103,500",
    "control": "Check units and sign. Price per share differs from bond price as a percentage of face value. Correct arithmetic cannot repair unsuitable inputs.",
    "data": "Position snapshot + price snapshot + method version → valuation run",
    "question": "Is $104,000 the profit?",
    "answer": "No. It is the holding value. Compared with yesterday's $100,000 close, the provisional movement is +$4,000.",
    "lesson": 2
  },
  {
    "id": "challenge",
    "label": "Challenge the mark",
    "owner": "Independent price verification / valuation control",
    "title": "Investigate the $500 difference",
    "body": "The candidate independent value is $500 below the desk value: 1,000 × ($103.50 − $104). This is an investigation signal, not an automatic journal.",
    "input": "Candidate value − desk value = −$500",
    "output": "Evidence-backed resolution, or an open exception",
    "control": "With usable evidence, assume review confirms $103.50 as the appropriate mark and approval is obtained. With stale evidence, request current comparable evidence and keep the exception open.",
    "data": "ValuationRunId → exception → evidence → reviewer decision",
    "question": "Should every difference be booked automatically?",
    "answer": "No. Check evidence, basis, policy and approval. Investigation tolerances do not establish fair value on their own.",
    "lesson": 4
  },
  {
    "id": "adjustment",
    "label": "Resolve & adjust",
    "owner": "Valuation control + finance approver",
    "title": "Book one correction, once",
    "body": "In the approved branch, a $500 downward correction changes $104,000 to $103,500. It could be implemented as a corrected mark or an adjustment, reconciled to prevent duplication.",
    "input": "Review decision and approval",
    "output": "Approved branch: −$500 correction · unresolved branch: no approved correction",
    "control": "Do not correct the mark and also deduct another $500 reserve for the same discrepancy. Other uncertainty reserves need their own rationale. Regulatory AVAs are separate and are not calculated here.",
    "data": "ExceptionId → ApprovalId → correction → ledger reconciliation",
    "question": "After resetting the price to $103.50, deduct another $500 for this discrepancy?",
    "answer": "No. That would count the correction twice. Track what is already included in the final value.",
    "lesson": 6
  },
  {
    "id": "pnl",
    "label": "Explain P&L",
    "owner": "Product control / finance",
    "title": "Separate value from movement",
    "body": "Assume valuation changes are recognised through P&L. No trades or cash flows occur today. The approved result is $103,500 closing value − $100,000 opening value = +$3,500. All is unrealised because no shares were sold.",
    "input": "Opening $100,000 · desk movement +$4,000 · correction −$500",
    "output": "Approved P&L +$3,500 · unresolved desk estimate +$4,000 is provisional",
    "control": "The purchase was yesterday. Do not subtract yesterday's cash payment again from today's value movement. Since-inception economic P&L equals holding value plus cumulative net cash here.",
    "data": "Prior approved close + current close + period flows → P&L explanation",
    "question": "Is the −$500 correction the whole day's P&L?",
    "answer": "No. It reduces the +$4,000 desk movement to +$3,500. It is one component of the bridge.",
    "lesson": 16
  },
  {
    "id": "reporting",
    "label": "Report & trace",
    "owner": "Finance reporting + control owners",
    "title": "Keep the number and evidence together",
    "body": "Report the holding, valuation, P&L and control status together. Trace the number through approval, prices and the original trade.",
    "input": "Position + values + movements + exception status",
    "output": "Traceable report row, with approval or an open exception",
    "control": "Never present the unresolved desk estimate as an approved close. This teaching workflow is not a complete ledger or regulatory return. Team ownership varies by firm.",
    "data": "Report row → valuation run → position / prices → trade + approval trail",
    "question": "Is a report complete just because its total adds up?",
    "answer": "No. Arithmetic reconciliation is necessary; completeness, evidence, approval and visible exceptions also matter.",
    "lesson": 18
  }
];

function journeyNumbers(usable=true){const quantity=1000,opening=100000,desk=104000,candidate=103500,correction=usable?-500:0,closing=desk+correction;return {quantity,opening,desk,candidate,correction,closing,pnl:closing-opening,cash:-100000,approved:usable};}
function journeyPrint(){return '<article id="trade-journey"><h1>A day in the life of a trade</h1><p>One fictional settled USD share trade. No fees, dividends, interest, FX, tax or other trades. P&L recognition is assumed. Approval is a supplied scenario fact.</p>'+TRADE_JOURNEY.map((s,i)=>'<section><h2>'+(i+1)+'. '+s.label+'</h2><p><strong>Owner:</strong> '+s.owner+'</p><p>'+s.body+'</p><p><strong>Input:</strong> '+s.input+'</p><p><strong>Output:</strong> '+s.output+'</p><p><strong>Control:</strong> '+s.control+'</p><pre class="example">'+s.data+'</pre><p><strong>Check:</strong> '+s.question+'</p><p><strong>Answer:</strong> '+s.answer+'</p></section>').join('')+'</article>';}
if(typeof module!=='undefined')module.exports={TRADE_JOURNEY,journeyNumbers,journeyPrint};
