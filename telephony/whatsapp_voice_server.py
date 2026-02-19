import os
import sys
import tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
import uvicorn
from twilio.rest import Client
from gtts import gTTS
from dotenv import load_dotenv
load_dotenv()

from ai.asi_one_client import ASIOneClient
from compliance.rbi_validator import RBIValidator

app = FastAPI(title="Banking Voice AI")
asi_client = ASIOneClient()
validator = RBIValidator()

twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

BANK_NAME = os.getenv("BANK_NAME", "XYZ Bank")
TWILIO_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+14155238886")
sessions = {}

from twilio.twiml.voice_response import VoiceResponse, Gather

@app.post("/voice/incoming")
async def voice_incoming(request: Request):
    form = await request.form()
    response = VoiceResponse()
    gather = Gather(input="speech", action="/voice/respond", timeout=3)
    gather.say("Welcome to BankVoiceAI. How can I help you today?")
    response.append(gather)
    return Response(content=str(response), media_type="application/xml")

@app.post("/voice/respond")
async def voice_respond(request: Request):
    form = await request.form()
    speech = form.get("SpeechResult", "")
    ai_reply = asi_client.chat(speech, [])
    response = VoiceResponse()
    response.say(ai_reply)
    response.redirect("/voice/incoming")
    return Response(content=str(response), media_type="application/xml")
    
@app.post("/whatsapp/message")
async def whatsapp_message(request: Request):
    form = await request.form()
    sender = form.get("From", "")
    body = form.get("Body", "").strip()
    msg_type = form.get("MessageType", "text")
    num_media = form.get("NumMedia", "0")

    print(f"\nWhatsApp from {sender}: {body}")

    if msg_type == "audio" or num_media != "0":
        media_url = form.get("MediaUrl0", "")
        if media_url:
            body = await transcribe_voice_note(media_url)
            print(f"Transcribed: {body}")

    if sender not in sessions:
        sessions[sender] = []
        greeting = (
            f"Welcome to {BANK_NAME} AI Assistant!\n\n"
            "I am your AI banking executive powered by ASI:ONE and Fetch.ai.\n\n"
            "I can help you with:\n"
            "- Account balance and transactions\n"
            "- Loan enquiries and rates\n"
            "- Card blocking\n"
            "- Interest rates and products\n\n"
            "Say 'agent' anytime to speak with a human executive.\n\n"
            "How may I help you today?"
        )
        send_whatsapp_message(sender, greeting)
        return HTMLResponse("")

    if validator.needs_escalation(body):
        reply = "Connecting you to a human executive now. A bank representative will contact you shortly!"
        del sessions[sender]
        send_whatsapp_message(sender, reply)
        return HTMLResponse("")

    history = sessions.get(sender, [])
    ai_reply = asi_client.chat(body, history)

    if not validator.is_safe_response(ai_reply):
        ai_reply = "I cannot share that information for security reasons. How else may I help you?"

    ai_reply = validator.sanitize(ai_reply)
    print(f"Agent replies: {ai_reply}")

    history.append({"role": "user", "content": body})
    history.append({"role": "assistant", "content": ai_reply})
    sessions[sender] = history[-10:]

    send_whatsapp_message(sender, f"{BANK_NAME} AI:\n\n{ai_reply}")
    return HTMLResponse("")


@app.post("/whatsapp/voice")
async def whatsapp_voice_incoming(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    caller = form.get("From", "unknown")
    print(f"\nIncoming WhatsApp call: {call_sid} from {caller}")
    sessions[call_sid] = []

    twiml = '<?xml version="1.0" encoding="UTF-8"?>'
    twiml += "<Response>"
    twiml += '<Say voice="Polly.Aditi" language="en-IN">'
    twiml += "Namaste! Welcome to " + BANK_NAME + ". "
    twiml += "I am your A.I. banking assistant. "
    twiml += "Your call is secure. How may I help you today?"
    twiml += "</Say>"
    twiml += '<Gather input="speech" action="/whatsapp/voice/respond" method="POST" language="en-IN" speechTimeout="auto">'
    twiml += "</Gather>"
    twiml += '<Say voice="Polly.Aditi" language="en-IN">Goodbye!</Say>'
    twiml += "</Response>"

    return HTMLResponse(content=twiml, media_type="application/xml")


@app.post("/whatsapp/voice/respond")
async def whatsapp_voice_respond(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    customer_text = form.get("SpeechResult", "")

    print(f"\nCustomer said: {customer_text}")

    if not customer_text.strip():
        twiml = '<?xml version="1.0" encoding="UTF-8"?>'
        twiml += "<Response>"
        twiml += '<Gather input="speech" action="/whatsapp/voice/respond" method="POST" language="en-IN" speechTimeout="auto">'
        twiml += '<Say voice="Polly.Aditi" language="en-IN">Sorry, I could not hear you. Please speak again.</Say>'
        twiml += "</Gather>"
        twiml += "</Response>"
        return HTMLResponse(content=twiml, media_type="application/xml")

    if validator.needs_escalation(customer_text):
        twiml = '<?xml version="1.0" encoding="UTF-8"?>'
        twiml += "<Response>"
        twiml += '<Say voice="Polly.Aditi" language="en-IN">Transferring you to a human executive now. Please hold.</Say>'
        twiml += "</Response>"
        return HTMLResponse(content=twiml, media_type="application/xml")

    history = sessions.get(call_sid, [])
    ai_reply = asi_client.chat(customer_text, history)

    if not validator.is_safe_response(ai_reply):
        ai_reply = "I cannot share that information. How else may I help you?"

    ai_reply = validator.sanitize(ai_reply)
    print(f"Agent replies: {ai_reply}")

    history.append({"role": "user", "content": customer_text})
    history.append({"role": "assistant", "content": ai_reply})
    sessions[call_sid] = history[-10:]

    safe_reply = ai_reply.replace("&", "and").replace("<", "").replace(">", "").replace('"', "'")

    twiml = '<?xml version="1.0" encoding="UTF-8"?>'
    twiml += "<Response>"
    twiml += '<Say voice="Polly.Aditi" language="en-IN">' + safe_reply + "</Say>"
    twiml += '<Gather input="speech" action="/whatsapp/voice/respond" method="POST" language="en-IN" speechTimeout="auto">'
    twiml += '<Say voice="Polly.Aditi" language="en-IN">Is there anything else I can help you with?</Say>'
    twiml += "</Gather>"
    twiml += '<Say voice="Polly.Aditi" language="en-IN">Thank you for calling ' + BANK_NAME + '. Have a great day!</Say>'
    twiml += "</Response>"

    return HTMLResponse(content=twiml, media_type="application/xml")


@app.post("/whatsapp/status")
async def call_status(request: Request):
    form = await request.form()
    status = form.get("CallStatus", form.get("MessageStatus", ""))
    sid = form.get("CallSid", form.get("MessageSid", ""))
    print(f"Status: {sid} -> {status}")
    if status in ["completed", "failed", "busy", "no-answer"]:
        sessions.pop(sid, None)
    return HTMLResponse("OK")


def send_whatsapp_message(to: str, body: str):
    try:
        twilio_client.messages.create(
            from_="whatsapp:" + TWILIO_NUMBER,
            to=to,
            body=body
        )
        print(f"Message sent to {to}")
    except Exception as e:
        print(f"Send error: {e}")


async def transcribe_voice_note(media_url: str) -> str:
    try:
        import whisper
        import httpx

        async with httpx.AsyncClient() as client:
            auth = (os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
            response = await client.get(media_url, auth=auth)

        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as f:
            f.write(response.content)
            temp_path = f.name

        model = whisper.load_model("base")
        result = model.transcribe(temp_path)
        os.unlink(temp_path)
        return result["text"].strip()

    except Exception as e:
        print(f"Transcription error: {e}")
        return "Could not transcribe audio. Please type your message."


@app.get("/")
@app.get("/health")
async def health():
    return {
        "status": "ONLINE",
        "service": "Banking Voice AI Agent",
        "powered_by": "ASI:ONE + Fetch.ai + Twilio WhatsApp",
        "active_sessions": len(sessions)
    }


if __name__ == "__main__":
    print("")
    print("=" * 55)
    print("  BANKING AI - WHATSAPP VOICE SERVER")
    print("  Powered by ASI:ONE + Fetch.ai + Twilio")
    print("=" * 55)
    print("")
    print("  Server starting on: http://localhost:8002")
    print("")
    print("  NEXT STEPS:")
    print("  1. Open NEW terminal -> run: ./ngrok http 8002")
    print("  2. Copy ngrok URL: https://xxxx.ngrok.io")
    print("  3. Twilio Console -> WhatsApp Sandbox Settings")
    print("  4. Set webhook: https://xxxx.ngrok.io/whatsapp/message")
    print("  5. WhatsApp the sandbox number to test!")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
