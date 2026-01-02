import os
import json
import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from dotenv import load_dotenv

from agents import brain_triage, brain_intel, brain_judge, check_rate_limit, is_user_blacklisted, block_user_session
from agents.utils import log_trace

load_dotenv()

app = FastAPI()

async def process_audit_log(log_entry: dict):
    """
    The Orchestrator function. It runs the 3-Brain Loop in the background.
    """

    event_id = log_entry.get("event_id", "unknown_event")
    user_id = log_entry.get("actor", {}).get("user_id", "unknown")
    print(f"\n [Webhook Recieved] Analyzing {event_id} / {user_id}...")

    if not check_rate_limit(user_id, limit=5, window=60):
        log_trace(event_id, "ENFORCER", "BLOCKED", {"reason": "Rate Limit Exceeded"})
        print(f" RATE LIMITER: Traffic throttled for {user_id}.")
        return

    if is_user_blacklisted(user_id):
        log_trace(event_id, "ENFORCER", "BLOCKED", {"reason": "User Blacklisted"})
        print(f" SHIELD: User {user_id} is blacklisted. Request dropped.")
        return

    log_trace(event_id, "TRIAGE", "THINKING", {"msg": "Analyzing intent..."})

    try:
        plan = brain_triage(log_entry)

        if plan["status"] == "SAFE":
            log_trace(event_id, "TRIAGE", "COMPLETED", {"risk": "LOW", "reason": plan.get("reason")})
            print(f" {user_id} is SAFE. (Architect cleared it)")
            return

 
        log_trace(event_id, "TRIAGE", "COMPLETED", {
            "risk": "HIGH",
            "search_vectors": plan.get("search_terms")
        })

    except Exception as e:
        log_trace(event_id, "TRIAGE", "FAILED", {"error": str(e)})
        print(f" TRAIGE: Failed to analyze intent. Error: {e}")
        return

    log_trace(event_id, "INTEL", "THINKING", {"msg": "Searching Vector DB..."})

    try:
        policies = brain_intel(plan["search_terms"])

        log_trace(event_id, "INTEL", "COMPLETED", {
            "found_docs": len(policies),
            "top_policy": policies[0][:50] + "..."
        })

    except Exception as e:
        log_trace(event_id, "INTEL", "FAILED", {"error": str(e)})
        print(f" INTEL: Failed to search vector DB. Error: {e}")
        return

    log_trace(event_id, "JUDGE", "THINKING", {"msg": "Deliberating..."})

    try:
        decision = brain_judge(log_entry, policies)
    
        model_tag = decision.get("model_used", "Junior Analyst")

        role_label = "CISO" if model_tag == "CISO" else "JUDGE"

        log_trace(event_id, role_label, "COMPLETED", {
            "verdict": decision["decision"],
            "confidence": decision.get("confidence", 100),
            "reason": decision.get("reasoning")
        })

        print(f" FINAL DECISION: {decision['decision']}")
        print(f" REASON: {decision.get('reasoning', 'No Reasoning Provided')}")

    except Exception as e:
        log_trace(event_id, "JUDGE", "FAILED", {"error": str(e)})
        print(f" JUDGE: Failed to deliberate. Error: {e}")
        return

    if decision["decision"] == "BLOCK":
        log_trace(event_id, "ENFORCER", "THINKING", {"msg": "Initiating Kill Switch..."})

        success = block_user_session(user_id, decision.get('reasoning', 'Blocked by Sentinel'))

        if success:
            log_trace(event_id, "ENFORCER", "COMPLETED", {"action": "SESSION_TERMINATED", "redis_key": f"blacklist:{user_id}"})
        else:
            log_trace(event_id, "ENFORCER", "FAILED", {"error": "Redis Connection Failed"})
    else:
        log_trace(event_id, "ENFORCER", "IDLE", {"msg": "User Allowed. No Action Taken."})
        print(f" ALLOWING User {user_id}. False Positive dismissed.")


@app.get("/")
def health_check():
    return {"status": "active", "service": "Sentinel Auditor"}

@app.post("/webhook/audit")
async def recieve_audit_log(request: Request, background_tasks: BackgroundTasks):
    """
    Supabase calls this whenever a new row is inserted into 'audit_logs'.
    """

    try:
        body = await request.json()

        record = body.get('record', {})
        log_content = record.get('payload')

        if not log_content:
            if 'actor' in body:
                log_content = body
            else:
                return {"status": "ignored", "reason": "No log payload found"}

        background_tasks.add_task(process_audit_log, log_content)

        return {"status": "processing", "message": "Sentinel is reviewing the log."}

    except Exception as e:
        print(f" Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
