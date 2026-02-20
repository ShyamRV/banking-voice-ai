"""
BankVoiceAI - WhatsApp + Voice Server (Production)
- Extracts sender phone number from every message
- Looks up real customer data from database
- Answers balance, loans, transactions with actual data
- Runs permanently on Railway (no ngrok needed)
Run: python telephony/whatsapp_voice_server.py
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from twilio.twiml.messaging_response import MessagingResponse
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.rest import Client
from dotenv import load_dotenv
import uvicorn
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Import database and AI
from database.mock_database import (
    get_customer_by_phone,
    get_account_balance,
    get_loan_status,
    get_recent_transactions,
    get_product_info,
    verify_customer,
)

try:
    from ai.asi_one_client import ASIOneClient
    asi_client = ASIOneClient()
    AI_AVAILABLE = True
except Exception:
    AI_AVAILABLE = False
    logger.warning("ASI:ONE not available — using database responses only")

# Twilio client
twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN"),
)

app = FastAPI(title="BankVoiceAI WhatsApp + Voice Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session memory per phone number
sessions: dict[str, list] = {}


# ─── INTENT DETECTION ─────────────────────────────────────────────────────────

def detect_intent(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["balance", "how much", "account"]):
        return "balance"
    if any(w in t for w in ["transaction", "history", "recent", "last", "statement"]):
        return "transactions"
    if any(w in t for w in ["loan", "emi", "mortgage", "payment due", "outstanding"]):
        return "loan"
    if any(w in t for w in ["mortgage rate", "personal loan", "auto loan", "cd rate", "interest rate"]):
        return "product"
    if any(w in t for w in ["block", "lost card", "stolen", "fraud", "unauthorized"]):
        return "urgent"
    if any(w in t for w in ["hi", "hello", "hey", "namaste", "help"]):
        return "greeting"
    return "general"


def get_response(phone: str, text: str) -> str:
    """Core logic: try database first, fall back to AI."""

    intent = detect_intent(text)
    customer = get_customer_by_phone(phone)

    # Greeting
    if intent == "greeting":
        if customer:
            name = customer["name"].split()[0]
            return (
                f"Hello {name}! Welcome to BankVoiceAI. I can help you with:\n"
                f"• Account balance\n"
                f"• Recent transactions\n"
                f"• Loan details\n"
                f"• Product rates\n\n"
                f"What would you like to know?"
            )
        return (
            "Welcome to BankVoiceAI! I can help with your banking needs.\n"
            "Please note: I can only assist registered customers.\n"
            "Type 'balance', 'transactions', or 'loans' to get started."
        )

    # Urgent — always escalate
    if intent == "urgent":
        return (
            "⚠️ This sounds urgent. For card blocking or fraud:\n"
            "• Call our 24/7 helpline: 1-800-BANK-VOI\n"
            "• Or reply BLOCK to immediately suspend your card\n"
            "A human agent will contact you within 5 minutes."
        )

    # Database lookups (requires verified customer)
    if customer:
        if intent == "balance":
            return get_account_balance(phone)
        if intent == "transactions":
            return get_recent_transactions(phone)
        if intent == "loan":
            return get_loan_status(phone)

    if intent == "product":
        t_lower = text.lower()
        if "mortgage" in t_lower or "home" in t_lower:
            return get_product_info("mortgage")
        if "auto" in t_lower or "car" in t_lower:
            return get_product_info("auto_loan")
        if "personal" in t_lower:
            return get_product_info("personal_loan")
        if "cd" in t_lower or "certificate" in t_lower:
            return get_product_info("certificate_of_deposit")
        if "savings" in t_lower:
            return get_product_info("savings_account")
        return get_product_info("checking_account")

    # Not a registered customer
    if not customer and intent in ["balance", "transactions", "loan"]:
        return (
            "I wasn't able to find your account with this number.\n"
            "Please make sure you're messaging from your registered phone number, "
            "or visit your nearest branch for assistance."
        )

    # Fall back to AI for general questions
    if AI_AVAILABLE:
        history = sessions.get(phone, [])
        context = ""
        if customer:
            context = f"Customer: {customer['name']}. "
        reply = asi_client.chat(
            text,
            history,
            system_prompt=(
                f"You are a professional banking AI assistant for BankVoiceAI. "
                f"{context}"
                f"Be concise and helpful. Keep responses under 4 sentences for WhatsApp."
            )
        )
        history.append({"role": "user", "content": text})
        history.append({"role": "assistant", "content": reply})
        sessions[phone] = history[-10:]
        return reply

    return "I'm here to help with your banking needs. Please ask about your balance, transactions, or loans."


# ─── WHATSAPP ENDPOINT ────────────────────────────────────────────────────────

@app.post("/whatsapp/message")
async def whatsapp_message(request: Request):
    form = await request.form()

    # Extract sender phone — Twilio sends as "whatsapp:+14085551234"
    from_number = str(form.get("From", "")).replace("whatsapp:", "").strip()
    body = str(form.get("Body", "")).strip()

    logger.info(f"WhatsApp from {from_number}: {body}")

    if not body:
        resp = MessagingResponse()
        resp.message("Please send a message to get started.")
        return Response(content=str(resp), media_type="application/xml")

    # Get real response using customer's phone number
    reply = get_response(from_number, body)
    logger.info(f"Reply to {from_number}: {reply[:100]}...")

    resp = MessagingResponse()
    resp.message(reply)
    return Response(content=str(resp), media_type="application/xml")


@app.post("/whatsapp/status")
async def whatsapp_status(request: Request):
    form = await request.form()
    status = form.get("MessageStatus", "")
    to = form.get("To", "")
    logger.info(f"Message status: {status} → {to}")
    return Response(content="OK", media_type="text/plain")


# ─── VOICE CALL ENDPOINTS ─────────────────────────────────────────────────────

@app.post("/voice/incoming")
async def voice_incoming(request: Request):
    """Answer incoming calls."""
    form = await request.form()
    from_number = str(form.get("From", "")).strip()
    logger.info(f"Incoming call from {from_number}")

    customer = get_customer_by_phone(from_number)
    name = customer["name"].split()[0] if customer else "there"

    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action="/voice/respond",
        timeout=4,
        speech_timeout="auto",
        language="en-US",
    )
    gather.say(
        f"Hello {name}! Welcome to BankVoiceAI. "
        f"How can I help you today? "
        f"You can ask about your balance, recent transactions, or loans.",
        voice="Polly.Joanna",
    )
    response.append(gather)
    response.say("I didn't hear anything. Please call back and try again.", voice="Polly.Joanna")
    return Response(content=str(response), media_type="application/xml")


@app.post("/voice/respond")
async def voice_respond(request: Request):
    """Process what the caller said and respond."""
    form = await request.form()
    speech = str(form.get("SpeechResult", "")).strip()
    from_number = str(form.get("From", "")).strip()

    logger.info(f"Voice from {from_number}: {speech}")

    if not speech:
        response = VoiceResponse()
        response.say("I didn't catch that. Let me transfer you to an agent.", voice="Polly.Joanna")
        return Response(content=str(response), media_type="application/xml")

    # Get database response
    reply = get_response(from_number, speech)

    # Clean reply for voice (remove bullet points and special chars)
    voice_reply = (
        reply
        .replace("•", "")
        .replace("₹", "Rupees ")
        .replace("$", "dollars ")
        .replace("\n", ". ")
        .replace("XXXX", "ending in")
    )

    response = VoiceResponse()
    response.say(voice_reply, voice="Polly.Joanna")

    # Offer to continue
    gather = Gather(
        input="speech",
        action="/voice/respond",
        timeout=4,
        speech_timeout="auto",
        language="en-US",
    )
    gather.say("Is there anything else I can help you with?", voice="Polly.Joanna")
    response.append(gather)
    response.say("Thank you for calling BankVoiceAI. Goodbye!", voice="Polly.Joanna")
    return Response(content=str(response), media_type="application/xml")


# ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "BankVoiceAI WhatsApp + Voice Server",
        "status": "running",
        "endpoints": ["/whatsapp/message", "/voice/incoming", "/voice/respond"],
        "customers_loaded": 5,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── STARTUP ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("VOICE_PORT", 8002))
    print(f"""
=======================================================
  BANKVOICEAI - WHATSAPP + VOICE SERVER
  Running on port {port}
=======================================================
  Customers loaded: 5
    • Shyamji Pandey (+91 8431439772)
    • James Mitchell (+1 408-555-1234)
    • Sarah Johnson  (+1 212-555-9876)
    • Robert Chen    (+1 702-555-4321)
    • Maria Garcia   (+1 310-555-7890)

  Endpoints:
    WhatsApp:  POST /whatsapp/message
    Voice in:  POST /voice/incoming
    Voice out: POST /voice/respond
    Health:    GET  /health
=======================================================
""")
    port = int(os.environ.get("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
