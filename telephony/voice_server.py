# telephony/voice_server.py
import os, sys, json, asyncio, tempfile, base64
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
import uvicorn
from dotenv import load_dotenv
load_dotenv()

from ai.asi_one_client import ASIOneClient
from compliance.rbi_validator import RBIValidator

app = FastAPI()
asi_client = ASIOneClient()
validator = RBIValidator()
sessions = {}

BANK_NAME = os.getenv('BANK_NAME', 'XYZ Bank')

# ================================================================
# HELPER: Build TwiML responses (avoids f-string + XML conflicts)
# ================================================================

def twiml_greeting():
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'Namaste! Welcome to ' + BANK_NAME + '. '
        'This is an A I banking assistant. '
        'Your call may be recorded for quality purposes.'
        '</Say>'
        '<Gather input="speech" action="/handle-speech" method="POST" '
        'language="en-IN" speechTimeout="auto" speechModel="phone_call">'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'How may I help you today?'
        '</Say>'
        '</Gather>'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'I did not hear anything. Please call again. Goodbye!'
        '</Say>'
        '</Response>'
    )


def twiml_didnt_hear():
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Gather input="speech" action="/handle-speech" method="POST" '
        'language="en-IN" speechTimeout="auto">'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'I am sorry, I did not catch that. Could you please repeat?'
        '</Say>'
        '</Gather>'
        '</Response>'
    )


def twiml_escalate():
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'Of course! I am connecting you to a human banking executive right away. '
        'Please hold for a moment. Thank you for your patience.'
        '</Say>'
        '<Enqueue>human-agents</Enqueue>'
        '</Response>'
    )


def twiml_reply(ai_reply):
    # Clean text — remove chars that break XML
    safe = (ai_reply
            .replace('&', ' and ')
            .replace('<', '')
            .replace('>', '')
            .replace('"', "'")
            .replace('\n', ' ')
            .strip())

    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Say voice="Polly.Aditi" language="en-IN">'
        + safe +
        '</Say>'
        '<Gather input="speech" action="/handle-speech" method="POST" '
        'language="en-IN" speechTimeout="auto" speechModel="phone_call">'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'Is there anything else I can help you with?'
        '</Say>'
        '</Gather>'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'Thank you for calling ' + BANK_NAME + '. Have a wonderful day. Goodbye!'
        '</Say>'
        '</Response>'
    )


def twiml_goodbye():
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response>'
        '<Say voice="Polly.Aditi" language="en-IN">'
        'Thank you for calling ' + BANK_NAME + '. Have a wonderful day. Goodbye!'
        '</Say>'
        '</Response>'
    )


# ================================================================
# ROUTE 1: Twilio hits this when someone calls your number
# ================================================================
@app.post("/incoming-call")
async def incoming_call(request: Request):
    print("\n" + "="*50)
    print("📞 INCOMING CALL RECEIVED!")
    print("="*50)
    return HTMLResponse(content=twiml_greeting(), media_type="application/xml")


# ================================================================
# ROUTE 2: Handles what the customer said
# ================================================================
@app.post("/handle-speech")
async def handle_speech(request: Request):
    form_data = await request.form()

    customer_text = form_data.get('SpeechResult', '').strip()
    call_sid      = form_data.get('CallSid', 'unknown')
    confidence    = form_data.get('Confidence', '0')

    print(f"\n📱 Call: {call_sid}")
    print(f"👤 Customer said: '{customer_text}' (confidence: {confidence})")

    # ── Nothing heard ──
    if not customer_text:
        return HTMLResponse(content=twiml_didnt_hear(), media_type="application/xml")

    # ── Goodbye keywords ──
    bye_words = ['bye', 'goodbye', 'thank you', 'thanks', 'that is all', 'nothing else']
    if any(w in customer_text.lower() for w in bye_words):
        if call_sid in sessions:
            del sessions[call_sid]
        return HTMLResponse(content=twiml_goodbye(), media_type="application/xml")

    # ── Escalation check ──
    if validator.needs_escalation(customer_text):
        print("🚨 ESCALATING TO HUMAN AGENT!")
        return HTMLResponse(content=twiml_escalate(), media_type="application/xml")

    # ── Get history ──
    history = sessions.get(call_sid, [])

    # ── Ask ASI:ONE ──
    print("🤖 Asking ASI:ONE...")
    ai_reply = asi_client.chat(customer_text, history)

    # ── Safety checks ──
    if not validator.is_safe_response(ai_reply):
        ai_reply = "I cannot share that information for security reasons. How else may I help you?"
    ai_reply = validator.sanitize(ai_reply)

    print(f"🤖 Agent replies: {ai_reply}")

    # ── Update history ──
    history.append({'role': 'user',      'content': customer_text})
    history.append({'role': 'assistant', 'content': ai_reply})
    sessions[call_sid] = history[-10:]

    return HTMLResponse(content=twiml_reply(ai_reply), media_type="application/xml")


# ================================================================
# ROUTE 3: Call status updates
# ================================================================
@app.post("/call-status")
async def call_status(request: Request):
    form_data = await request.form()
    status   = form_data.get('CallStatus', '')
    call_sid = form_data.get('CallSid', '')

    print(f"📊 Call {call_sid[-6:]}... → {status.upper()}")

    if status in ['completed', 'failed', 'busy', 'no-answer']:
        if call_sid in sessions:
            del sessions[call_sid]
            print(f"🧹 Session cleaned up")

    return HTMLResponse(content="OK")


# ================================================================
# ROUTE 4: Health check
# ================================================================
@app.get("/")
@app.get("/health")
async def health():
    return {
        "status"      : "ONLINE",
        "service"     : "Banking Voice AI Agent",
        "powered_by"  : ["ASI:ONE", "Fetch.ai", "Twilio"],
        "active_calls": len(sessions)
    }


# ================================================================
# START
# ================================================================
if __name__ == "__main__":
    print()
    print("=" * 55)
    print("   BANKING VOICE AI - REAL PHONE CALL SERVER")
    print("   Powered by ASI:ONE + Fetch.ai + Twilio")
    print("=" * 55)
    print()
    print("  Server starting on: http://localhost:8001")
    print()
    print("  NEXT STEPS:")
    print("  1. Open NEW terminal")
    print("  2. Run: ./ngrok http 8001")
    print("  3. Copy ngrok URL: https://xxxx.ngrok.io")
    print("  4. Twilio Console -> Phone Numbers -> Your Number")
    print("  5. Set webhook: https://xxxx.ngrok.io/incoming-call")
    print("  6. CALL YOUR TWILIO NUMBER!")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
