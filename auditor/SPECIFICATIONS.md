
#1. The Sentinel Auditor: Job Description (The Spec)**Role:** Autonomous Security Analyst Agent
**Architecture:** "Three Brains" (Architect, Critique, Assembler)
**Trigger:** Asynchronous event (Database Insert / Message Queue)
**Latency Requirement:** None (Background Process)

###The "Three Brains" WorkflowWhen a new `audit_log` arrives, the Auditor performs these steps:

1. **🧠 The Architect (Investigator)**
* **Input:** The `audit_log` JSON.
* **Action:** Formulates a query plan to verify the "facts" of the event.
* **Example:** *"User blocked for 'impossible_travel'. Query Supabase for the user's last known login timestamp and location."*


2. **🧠 The Critique (Compliance Officer)**
* **Input:** The Architect's findings + The Company Policy (RAG Vector DB).
* **Action:** Checks if a specific business rule overrides the security alert.
* **Example:** *"Search Policy PDF for 'Executive Travel Rules'. Found: 'Admins allow VPN usage'. Override the initial security block."*


3. **🧠 The Assembler (Reporter)**
* **Input:** The combined context from Architect and Critique.
* **Action:** Updates the database with the final verdict and sends an alert (Slack/Email) if necessary.
* **Output:** A human-readable Incident Report.



---

#2. The Immutable Contract (The Payload)This is the exact JSON object your API must construct. This is the "common language" between your Bank/Sentinel API and the Auditor.

```json
{
  // --- METADATA (System Health & Tracing) ---
  "event_id": "evt_550e8400-e29b-41d4-a716-446655440000", // UUID v4
  "correlation_id": "corr_123abc_request_x",             // From Frontend Request Header
  "timestamp": "2025-12-16T22:45:00.000Z",               // ISO 8601
  "environment": "production",                           // "production" | "staging"

  // --- ACTOR CONTEXT (Who did it?) ---
  "actor": {
    "user_id": "usr_87123",
    "role": "admin_viewer",         // Critical for Policy RAG
    "session_id": "sess_998877",
    "session_age_seconds": 3400     // Helps detect "stolen cookie" vs "bot"
  },

  // --- NETWORK CONTEXT (Where are they?) ---
  "network_context": {
    "ip_address": "203.0.113.45",
    "ip_reputation": "high_risk_vpn", // Optional enrichment
    "geo_location": {
      "country": "DE",
      "city": "Berlin",
      "asn": "AS12345 Deutsche Telekom"
    },
    // The "Gold Star" Security Fields
    "client_fingerprint": {
      "user_agent_raw": "Mozilla/5.0...",
      "ja3_hash": "e7d705a3286e19ea42f587b344ee6865", // SSL Fingerprint (Mock this for now)
      "device_id": "dev_uuid_v4_cookie"
    }
  },

  // --- ACTION CONTEXT (What did they try?) ---
  "action_context": {
    "service": "transfer_service",
    "action_type": "fund_transfer",
    "resource_target": "account_999",
    "details": {
      "amount": 15000.00,
      "currency": "USD",
      "recipient_country": "CN"    // Critical for AML Policy
    }
  },

  // --- SENTINEL ANALYSIS (What did the ML think?) ---
  "sentinel_analysis": {
    "engine_version": "v2.1.0",
    "risk_score": 0.94,            // Normalized 0.0 - 1.0
    "decision": "CHALLENGE_REQUIRED",
    "anomaly_vectors": [           // ABSTRACT strings only
      "impossible_travel",
      "typing_cadence_mismatch"
    ]
  },

  // --- ENFORCEMENT (What happened immediately?) ---
  "security_enforcement": {
    "mfa_status": "verified_time_based_otp",
    "policy_applied": "POLICY_EXEC_01"
  }
}

```

---

#3. How to Send the Attributes (The Transport)You do **not** need a separate Kafka queue. You are using Supabase, so you will use **Table-Based Queueing**.

###Phase A: Source Mapping (Where do I get the data?)In your Next.js/NestJS API, you gather data from 3 sources to build the JSON.

| JSON Section | Source in Code | Example Code Access |
| --- | --- | --- |
| `metadata` | Generated Locally | `crypto.randomUUID()`, `new Date()` |
| `actor` | Auth Token (JWT) | `req.user.id`, `req.user.role` (via Supabase Auth) |
| `network` | Request Headers | `req.headers['x-forwarded-for']`, `req.headers['cf-ipcountry']` |
| `action` | Request Body | `req.body.amount`, `req.body.recipient` |
| `sentinel` | **Internal API Call** | `await sentinelModel.predict(req.body.keystrokes)` |

###Phase B: The Sender Code (The "Hot Path")*Location:* Your Banking API Controller (e.g., `transfer.ts`).

```typescript
// 1. Gather Data (0ms latency impact)
const user = req.user; // from Auth Middleware
const ip = req.headers['x-forwarded-for'] || '127.0.0.1';
const geo = req.headers['x-vercel-ip-country'] || 'UNKNOWN';

// 2. Call Sentinel Engine (The only "real" calculation)
// This is your River model running in Python, exposed via API
const sentinelResponse = await axios.post('http://sentinel-engine/analyze', {
  keystrokes: req.body.keystrokes
});

// 3. Construct the Immutable Contract
const auditLog = {
  event_id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  actor: {
    user_id: user.id,
    role: user.role, // "premium_user"
    session_age_seconds: (Date.now() - user.auth_time) / 1000
  },
  network_context: {
    ip_address: ip,
    geo_location: { country: geo }
    // ... fill other fields
  },
  sentinel_analysis: {
    risk_score: sentinelResponse.data.score,
    decision: sentinelResponse.data.status,
    anomaly_vectors: sentinelResponse.data.reasons // ["flight_time_deviation"]
  }
  // ... fill remaining context
};

// 4. THE SEND: Fire and Forget (Async)
// We Insert into Supabase. We do NOT wait for the Auditor to finish.
const { error } = await supabase.from('audit_logs').insert(auditLog);

// 5. Return immediate response to User
if (sentinelResponse.data.status === 'BLOCK') {
  throw new ForbiddenException("Security Check Failed");
}
return { success: true };

```

###Phase C: The Receiver (The "Cold Path")*Location:* Your RAG Agent (Python script running continuously or Serverless Function).

You listen to the database insert. This is your "Queue".

```python
from supabase import create_client

# This script runs 24/7 (or is triggered by Webhook)
def handle_new_log(payload):
    log_entry = payload['new'] # The JSON you just inserted
    
    print(f"Auditor Woke Up for Event: {log_entry['event_id']}")
    
    # 1. ARCHITECT: Parse the JSON
    if log_entry['sentinel_analysis']['risk_score'] > 0.8:
        # 2. CRITIQUE: Check RAG Policy
        policy = rag_vector_db.search(f"Policy for role {log_entry['actor']['role']}")
        
        # 3. ASSEMBLER: Make decision
        if "Allow VPN" in policy and "high_risk_vpn" in log_entry['network_context']:
            print("Verdict: FALSE POSITIVE. Overriding block.")
            fix_user_account(log_entry['actor']['user_id'])

# Listen to Supabase Realtime
supabase.table('audit_logs').on('INSERT', handle_new_log).subscribe()

```

###Summary1. **Bank API** builds the JSON.
2. **Bank API** saves JSON to `audit_logs` table.
3. **Auditor Agent** sees the new row (via Realtime) and wakes up.
4. **Auditor Agent** thinks, checks policy, and updates the row with a verdict.

This is robust, strictly typed, and completely decouples your User Experience from your AI processing.

