"""
Test Client - Acts as BUYER in payment protocol.
Waits for RequestPayment from main agent, then commits.
"""

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.payment import (
    payment_protocol_spec,
    RequestPayment,
    CommitPayment,
    CompletePayment,
    CancelPayment,
)
from uuid import uuid4

test_agent = Agent(
    name="Test Client",
    seed="test-client-seed-bankvoiceai",
    port=8001,
    endpoint=["http://localhost:8001/submit"],
    network="testnet",
)

buyer_proto = Protocol(spec=payment_protocol_spec, role="buyer")


@buyer_proto.on_message(RequestPayment)
async def handle_payment_request(ctx: Context, sender: str, msg: RequestPayment):
    ctx.logger.info(f"📨 Received payment request from {sender}")
    ctx.logger.info(f"   Amount: {msg.accepted_funds[0].amount} {msg.accepted_funds[0].currency}")
    ctx.logger.info(f"   Description: {msg.description}")

    commit = CommitPayment(
        transaction_id=f"test_tx_{uuid4().hex[:16]}",
        funds=msg.accepted_funds[0],
        recipient=msg.recipient,
        metadata={
            "subscription_tier": "starter",
            "buyer_fet_wallet": "fetch1quuv23cpyse4mca5ug03df20rx00rl4aznrsud",
        }
    )
    ctx.logger.info(f"💳 Committing payment with tx: {commit.transaction_id}")
    await ctx.send(sender, commit)


@buyer_proto.on_message(CompletePayment)
async def handle_complete(ctx: Context, sender: str, msg: CompletePayment):
    ctx.logger.info(f"✅ Payment COMPLETED! TX: {msg.transaction_id}")
    ctx.logger.info("🎉 Subscription activated successfully!")


@buyer_proto.on_message(CancelPayment)
async def handle_cancel(ctx: Context, sender: str, msg: CancelPayment):
    ctx.logger.info(f"❌ Payment cancelled: {msg.reason}")


test_agent.include(buyer_proto, publish_manifest=True)


@test_agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info("=" * 50)
    ctx.logger.info("  🧪 TEST CLIENT RUNNING")
    ctx.logger.info(f"  Address: {test_agent.address}")
    ctx.logger.info("  Waiting for payment request from main agent...")
    ctx.logger.info("=" * 50)


if __name__ == "__main__":
    test_agent.run()
