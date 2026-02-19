import os
from dotenv import load_dotenv
from uagents import Agent, Context
from payment_integration.payment_proto import (
    payment_proto,
    set_agent_wallet,
    request_subscription_payment,
    get_tier_pricing,
    check_subscription_status,
)
from payment_integration.tier_manager import TierManager

load_dotenv()

TEST_CLIENT_ADDRESS = "agent1qguhmswpvppm3lmrsxs40x38x2ruk3uclkkh3tr0es8jrzuw2wzmzg4m4y0"

agent = Agent(
    name=os.getenv("AGENT_NAME", "BankVoiceAI Production"),
    seed=os.getenv("AGENT_SEED_PHRASE", "bankvoiceai-production"),
    port=int(os.getenv("AGENT_PORT", "8000")),
    endpoint=[f"http://localhost:{os.getenv('AGENT_PORT', '8000')}/submit"],
    network="testnet",
    mailbox=True,
)

agent.include(payment_proto, publish_manifest=True)
set_agent_wallet(agent.wallet)


@agent.on_event("startup")
async def startup(ctx: Context):
    print("=" * 70)
    print("  🏦 BANKVOICEAI - PRODUCTION AGENT")
    print("  Powered by ASI:ONE + Fetch.ai uAgents")
    print("=" * 70)
    print(f"  Agent Address: {agent.address}")
    print(f"  FET Wallet: {agent.wallet.address()}")
    print("=" * 70)
    print("  💰 SUBSCRIPTION TIERS:")
    tiers = get_tier_pricing()
    for tier_key, tier_info in tiers.items():
        print(f"     {tier_info['name']:15} ${tier_info['price_usd']:,}/month - {tier_info['calls_included']:,} calls")
    print("=" * 70)
    print("  ✅ Payment protocol active - Ready to accept subscriptions!")
    print("=" * 70)
    print()
    print("  📝 TESTNET SETUP:")
    print(f"     1. Get testnet FET: https://faucet-dorado.fetch.ai/")
    print(f"     2. Your wallet: {agent.wallet.address()}")
    print("=" * 70)


@agent.on_interval(period=30.0)
async def send_payment_request(ctx: Context):
    status = check_subscription_status(ctx, TEST_CLIENT_ADDRESS)
    if not status["active"]:
        ctx.logger.info("📤 Client has no subscription, requesting payment...")
        await request_subscription_payment(ctx, TEST_CLIENT_ADDRESS, "starter")
    else:
        ctx.logger.info(f"✅ Client already subscribed: {status['tier']} tier, {status['calls_remaining']} calls remaining")

if __name__ == "__main__":
    agent.run()
