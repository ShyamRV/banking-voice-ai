# test_client.py
import asyncio
from uagents import Agent, Context, Model

# ============================================
# PASTE YOUR REAL ADDRESS FROM main.py HERE
# ============================================
AGENT_ADDRESS = 'agent1q2gwaeecqucrurnzh3u4dpcelwkq2h4ljuc005gpxz2jq0vk6swes5j4qrz'

class CustomerQuery(Model):
    text: str
    session_id: str = 'default'

class AgentResponse(Model):
    reply: str
    escalate: bool = False

# IMPORTANT: Must have endpoint so main agent can reply back
test_agent = Agent(
    name='test_client',
    seed='test_seed_12345',
    port=8001,
    endpoint=['http://localhost:8001/submit']  # ← THIS WAS MISSING
)

queries_sent = 0

@test_agent.on_event('startup')
async def send_test(ctx: Context):
    ctx.logger.info(f'Test client started: {ctx.agent.address}')
    ctx.logger.info(f'Sending queries to: {AGENT_ADDRESS}')
    await asyncio.sleep(2)  # Wait for main agent to be ready

    test_queries = [
        'What is my account balance?',
        'I need to block my credit card',
        'What are your home loan interest rates?',
        'I want to speak to a manager',
    ]

    for query in test_queries:
        ctx.logger.info(f'>>> Sending: {query}')
        await ctx.send(
            AGENT_ADDRESS,
            CustomerQuery(text=query, session_id='test_session_001')
        )
        await asyncio.sleep(4)  # Wait for response before next query

@test_agent.on_message(model=AgentResponse)
async def receive_response(ctx: Context, sender: str, msg: AgentResponse):
    print(f'\n=============================')
    print(f'AGENT RESPONSE: {msg.reply}')
    if msg.escalate:
        print('>>> ESCALATED TO HUMAN AGENT <<<')
    print(f'=============================\n')

if __name__ == '__main__':
    test_agent.run()
