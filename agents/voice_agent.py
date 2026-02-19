import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from uagents import Agent, Context, Model
from dotenv import load_dotenv
from ai.asi_one_client import ASIOneClient
from ai.text_to_speech import TextToSpeech
from compliance.rbi_validator import RBIValidator
from payment_integration.payment_proto import check_subscription_status

load_dotenv()

# --- Message Models ---
class CustomerQuery(Model):
    text: str
    session_id: str = 'default'

class AgentResponse(Model):
    reply: str
    escalate: bool = False

# --- Create Fetch.ai Agent ---
bank_agent = Agent(
    name='banking_voice_agent',
    seed=os.getenv('AGENT_SEED', 'banking_seed_phrase'),
    port=int(os.getenv('AGENT_PORT', 8000)),
    endpoint=[f"http://localhost:{os.getenv('AGENT_PORT', 8000)}/submit"]
)

# --- Globals ---
asi_client = ASIOneClient()
tts = TextToSpeech(engine='pyttsx3')
validator = RBIValidator()
sessions = {}  # Store conversation history per session


@bank_agent.on_event('startup')
async def startup(ctx: Context):
    ctx.logger.info(f'Banking Voice Agent running!')
    ctx.logger.info(f'Agent address: {bank_agent.address}')
    tts.speak(RBIValidator.MANDATORY_DISCLOSURE)


@bank_agent.on_message(model=CustomerQuery)
async def handle_query(ctx: Context, sender: str, msg: CustomerQuery):
    ctx.logger.info(f'Received query: {msg.text}')

    # --- Subscription gate ---
    status = check_subscription_status(ctx, sender)
    if not status["active"]:
        reply = "Access denied. Please subscribe to BankVoiceAI to use this service."
        ctx.logger.warning(f"Blocked unsubscribed sender: {sender}")
        await ctx.send(sender, AgentResponse(reply=reply))
        return

    ctx.logger.info(f"Subscription active: {status['tier']} tier, {status['calls_remaining']} calls remaining")

    # --- Check if escalation needed ---
    if validator.needs_escalation(msg.text):
        reply = 'I am connecting you to a human agent right away.'
        tts.speak(reply)
        await ctx.send(sender, AgentResponse(reply=reply, escalate=True))
        return

    # --- Get conversation history ---
    history = sessions.get(msg.session_id, [])

    # --- Get AI response from ASI:ONE ---
    ai_reply = asi_client.chat(msg.text, history)

    # --- Safety check ---
    if not validator.is_safe_response(ai_reply):
        ai_reply = 'I cannot share that information. How else can I help?'

    # --- Sanitize response ---
    ai_reply = validator.sanitize(ai_reply)

    # --- Update session history ---
    history.append({'role': 'user', 'content': msg.text})
    history.append({'role': 'assistant', 'content': ai_reply})
    sessions[msg.session_id] = history[-10:]  # Keep last 5 exchanges

    # --- Speak and send response ---
    tts.speak(ai_reply)
    await ctx.send(sender, AgentResponse(reply=ai_reply))


if __name__ == '__main__':
    bank_agent.run()