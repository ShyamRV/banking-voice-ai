"""
BankVoiceAI Payment Protocol - FET Token Integration
Complete production-ready payment system with tiered subscriptions
"""

import os
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from uagents import Context, Protocol
from uagents_core.contrib.protocols.payment import (
    CancelPayment,
    CommitPayment,
    CompletePayment,
    Funds,
    RejectPayment,
    RequestPayment,
    payment_protocol_spec,
)

try:
    from cosmpy.aerial.client import LedgerClient, NetworkConfig
    COSMPY_AVAILABLE = True
except ImportError:
    COSMPY_AVAILABLE = False
    print("WARNING: cosmpy not installed. Run: pip install cosmpy")

# Payment protocol setup
payment_proto = Protocol(spec=payment_protocol_spec, role="seller")

# SUBSCRIPTION TIERS (FET pricing assuming 1 FET = $0.50)
SUBSCRIPTION_TIERS = {
    "starter": {
        "name": "Starter",
        "price_usd": 1500,
        "price_fet": "3000",
        "calls_included": 5000,
        "overage_fee_fet": "1.0",
        "access_level": "limited",
        "features": [
            "whatsapp_text",
            "whatsapp_voice_messages",
            "basic_queries",
            "general_info_only",
        ],
        "description": "WhatsApp messaging with basic queries - Perfect for small clinics",
    },
    "professional": {
        "name": "Professional",
        "price_usd": 3000,
        "price_fet": "6000",
        "calls_included": 15000,
        "overage_fee_fet": "0.8",
        "access_level": "complete_calls_limited_whatsapp",
        "features": [
            "phone_calls",
            "whatsapp_text",
            "whatsapp_voice_messages",
            "cbs_readonly",
            "customer_records",
            "basic_analytics",
        ],
        "description": "Phone calls + WhatsApp + Read-only CBS - For mid-size banks",
    },
    "enterprise": {
        "name": "Enterprise",
        "price_usd": 6000,
        "price_fet": "12000",
        "calls_included": 40000,
        "overage_fee_fet": "0.6",
        "access_level": "complete",
        "features": [
            "phone_calls",
            "whatsapp_text",
            "whatsapp_voice_messages",
            "sms",
            "cbs_full_access",
            "customer_records",
            "loan_management",
            "fraud_detection",
            "custom_agents",
            "advanced_analytics",
            "priority_support",
            "sla_guarantee",
        ],
        "description": "Full access to all systems - For large banks & enterprises",
    },
}

_agent_wallet = None


def set_agent_wallet(wallet):
    """Set the agent's FET wallet for receiving payments."""
    global _agent_wallet
    _agent_wallet = wallet


def verify_fet_payment(
    transaction_id: str,
    expected_amount_fet: str,
    sender_fet_address: str,
    recipient_wallet,
    logger,
) -> bool:
    """
    Verify on-chain FET payment using Fetch.ai ledger.
    Returns True if payment is valid and matches expected amount.
    """
    if not COSMPY_AVAILABLE:
        logger.error("cosmpy not installed - cannot verify payments")
        return False

    try:
        testnet = os.getenv("FET_USE_TESTNET", "true").lower() == "true"
        network_config = (
            NetworkConfig.fetchai_stable_testnet()
            if testnet
            else NetworkConfig.fetchai_mainnet()
        )
        ledger = LedgerClient(network_config)

        # Convert FET to micro units (1 FET = 10^18 atestfet/afet)
        expected_amount_micro = int(float(expected_amount_fet) * 10**18)

        logger.info(
            f"💰 Verifying payment: {expected_amount_fet} FET "
            f"from {sender_fet_address} to {recipient_wallet.address()}"
        )

        # Query transaction on blockchain
        tx_response = ledger.query_tx(transaction_id)

        if not tx_response.is_successful():
            logger.error(f"❌ Transaction {transaction_id} not successful")
            return False

        # Verify transfer event details
        recipient_found = False
        amount_found = False
        sender_found = False
        denom = "atestfet" if testnet else "afet"
        expected_recipient = str(recipient_wallet.address())

        for event_type, event_attrs in tx_response.events.items():
            if event_type == "transfer":
                if event_attrs.get("recipient") == expected_recipient:
                    recipient_found = True
                    if event_attrs.get("sender") == sender_fet_address:
                        sender_found = True
                    amount_str = event_attrs.get("amount", "")
                    if amount_str and amount_str.endswith(denom):
                        try:
                            amount_value = int(amount_str.replace(denom, ""))
                            if amount_value >= expected_amount_micro:
                                amount_found = True
                        except Exception:
                            pass

        if recipient_found and amount_found and sender_found:
            logger.info(f"✅ Payment verified: {transaction_id}")
            return True

        logger.error(
            f"❌ Payment verification failed - "
            f"recipient: {recipient_found}, amount: {amount_found}, sender: {sender_found}"
        )
        return False

    except Exception as e:
        logger.error(f"❌ Payment verification error: {e}")
        return False


async def request_subscription_payment(
    ctx: Context, user_address: str, tier: str = "starter"
):
    """
    Request subscription payment from client for specified tier.
    tier: "starter", "professional", or "enterprise"
    """
    if tier not in SUBSCRIPTION_TIERS:
        ctx.logger.error(f"Invalid subscription tier: {tier}")
        return

    tier_info = SUBSCRIPTION_TIERS[tier]
    funds = Funds(
        currency="FET",
        amount=tier_info["price_fet"],
        payment_method="fet_direct",
    )

    testnet = os.getenv("FET_USE_TESTNET", "true").lower() == "true"
    fet_network = "stable-testnet" if testnet else "mainnet"

    metadata = {
        "provider_agent_wallet": str(_agent_wallet.address()) if _agent_wallet else "unknown",
        "fet_network": fet_network,
        "subscription_tier": tier,
        "price_usd": str(tier_info["price_usd"]),
        "calls_included": str(tier_info["calls_included"]),
        "access_level": tier_info["access_level"],
        "features": ",".join(tier_info["features"]),
        "content": f"BankVoiceAI {tier_info['name']} - ${tier_info['price_usd']}/month",
    }

    payment_request = RequestPayment(
        accepted_funds=[funds],
        recipient=str(_agent_wallet.address()) if _agent_wallet else "unknown",
        deadline_seconds=600,
        reference=str(uuid4()),
        description=tier_info["description"],
        metadata=metadata,
    )

    ctx.logger.info(
        f"💰 Requesting {tier_info['price_fet']} FET (${tier_info['price_usd']}) "
        f"from {user_address} for {tier} tier"
    )
    await ctx.send(user_address, payment_request)


@payment_proto.on_message(CommitPayment)
async def handle_commit_payment(ctx: Context, sender: str, msg: CommitPayment):
    """Handle subscription payment commitment from bank/client."""
    ctx.logger.info(f"💳 Payment commitment received from {sender}")

    payment_verified = False

    # TEST MODE: bypass blockchain verification for test transactions
    is_test = msg.transaction_id.startswith("test_")
    if is_test:
        ctx.logger.info("🧪 Test transaction detected - skipping blockchain verification")
        payment_verified = True

    elif msg.funds.payment_method == "fet_direct" and msg.funds.currency == "FET":
        try:
            buyer_wallet = None
            if isinstance(msg.metadata, dict):
                buyer_wallet = msg.metadata.get("buyer_fet_wallet") or msg.metadata.get(
                    "buyer_fet_address"
                )

            if not buyer_wallet:
                ctx.logger.error("Missing buyer FET wallet address in metadata")
            else:
                payment_verified = verify_fet_payment(
                    transaction_id=msg.transaction_id,
                    expected_amount_fet=msg.funds.amount,
                    sender_fet_address=buyer_wallet,
                    recipient_wallet=_agent_wallet,
                    logger=ctx.logger,
                )
        except Exception as e:
            ctx.logger.error(f"FET verification error: {e}")
    else:
        ctx.logger.error(f"Unsupported payment method: {msg.funds.payment_method}")

    if payment_verified:
        ctx.logger.info(f"✅ Payment verified successfully from {sender}")

        # Complete the payment
        await ctx.send(sender, CompletePayment(transaction_id=msg.transaction_id))

        # Activate subscription
        tier = (
            msg.metadata.get("subscription_tier")
            if isinstance(msg.metadata, dict)
            else "starter"
        )
        tier_info = SUBSCRIPTION_TIERS.get(tier, SUBSCRIPTION_TIERS["starter"])

        # Calculate expiry (30 days from now)
        expiry_date = datetime.now(timezone.utc) + timedelta(days=30)

        # Store subscription details
        ctx.storage.set(f"subscription:{sender}:active", True)
        ctx.storage.set(f"subscription:{sender}:tier", tier)
        ctx.storage.set(f"subscription:{sender}:limit", tier_info["calls_included"])
        ctx.storage.set(f"subscription:{sender}:used", 0)
        ctx.storage.set(f"subscription:{sender}:overage_fee", tier_info["overage_fee_fet"])
        ctx.storage.set(f"subscription:{sender}:access_level", tier_info["access_level"])
        ctx.storage.set(f"subscription:{sender}:features", ",".join(tier_info["features"]))
        ctx.storage.set(f"subscription:{sender}:expiry", expiry_date.isoformat())
        ctx.storage.set(f"subscription:{sender}:payment_tx", msg.transaction_id)
        ctx.storage.set(f"subscription:{sender}:amount_paid", msg.funds.amount)
        ctx.storage.set(f"subscription:{sender}:activated_at", datetime.now(timezone.utc).isoformat())

        ctx.logger.info(
            f"📊 Subscription activated: {tier} tier for {sender} "
            f"({tier_info['calls_included']} calls, expires {expiry_date.date()})"
        )

    else:
        ctx.logger.error(f"❌ Payment verification failed from {sender}")
        await ctx.send(
            sender,
            CancelPayment(
                transaction_id=msg.transaction_id,
                reason="Payment verification failed - transaction not found on blockchain",
            ),
        )


@payment_proto.on_message(RejectPayment)
async def handle_reject_payment(ctx: Context, sender: str, msg: RejectPayment):
    """Handle payment rejection from client."""
    ctx.logger.info(f"❌ Payment rejected by {sender}: {msg.reason}")


def check_subscription_status(ctx: Context, user_address: str) -> dict:
    """
    Check if client has active subscription and return details.
    Returns dict with: {active, tier, calls_remaining, access_level, features}
    """
    if not ctx.storage.get(f"subscription:{user_address}:active"):
        return {"active": False, "reason": "No active subscription"}

    # Check expiry
    expiry_str = ctx.storage.get(f"subscription:{user_address}:expiry")
    if expiry_str:
        expiry_date = datetime.fromisoformat(expiry_str)
        if datetime.now(timezone.utc) > expiry_date:
            ctx.storage.set(f"subscription:{user_address}:active", False)
            return {"active": False, "reason": "Subscription expired"}

    # Get subscription details
    tier = ctx.storage.get(f"subscription:{user_address}:tier") or "starter"
    limit = ctx.storage.get(f"subscription:{user_address}:limit") or 0
    used = ctx.storage.get(f"subscription:{user_address}:used") or 0
    access_level = ctx.storage.get(f"subscription:{user_address}:access_level") or "limited"
    features = ctx.storage.get(f"subscription:{user_address}:features") or ""

    calls_remaining = limit - used

    return {
        "active": True,
        "tier": tier,
        "calls_included": limit,
        "calls_used": used,
        "calls_remaining": calls_remaining,
        "access_level": access_level,
        "features": features.split(",") if features else [],
        "overage_allowed": True,
        "expiry": expiry_str,
    }


def increment_usage(ctx: Context, user_address: str) -> dict:
    """
    Increment usage counter for client.
    Returns dict with: {success, calls_used, overage, overage_fee}
    """
    if not ctx.storage.get(f"subscription:{user_address}:active"):
        return {"success": False, "reason": "No active subscription"}

    limit = ctx.storage.get(f"subscription:{user_address}:limit") or 0
    used = ctx.storage.get(f"subscription:{user_address}:used") or 0
    overage_fee_fet = ctx.storage.get(f"subscription:{user_address}:overage_fee") or "0"

    # Increment usage
    new_used = used + 1
    ctx.storage.set(f"subscription:{user_address}:used", new_used)

    # Check if overage
    is_overage = new_used > limit
    overage_amount = new_used - limit if is_overage else 0

    ctx.logger.info(
        f"📈 Usage: {user_address} - {new_used}/{limit} calls "
        f"{'(+' + str(overage_amount) + ' overage)' if is_overage else ''}"
    )

    return {
        "success": True,
        "calls_used": new_used,
        "calls_limit": limit,
        "is_overage": is_overage,
        "overage_count": overage_amount,
        "overage_fee_per_call": overage_fee_fet if is_overage else "0",
    }


def get_tier_pricing() -> dict:
    """Get all subscription tier pricing information."""
    return SUBSCRIPTION_TIERS