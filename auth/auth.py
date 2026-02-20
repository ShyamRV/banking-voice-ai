"""
BankVoiceAI - Authentication System
Wallet-based login for US bank clients.
Each bank sees only their own data.
"""

import os
import jwt
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "bankvoiceai-super-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

security = HTTPBearer()

# ─── REGISTERED BANK CLIENTS ─────────────────────────────────────────────────
# In production: store in PostgreSQL database
# For now: hardcoded for demo (add real clients as they onboard)

BANK_CLIENTS = {
    # wallet_address -> bank profile
    "fetch1quuv23cpyse4mca5ug03df20rx00rl4aznrsud": {
        "bank_id": "BANK001",
        "bank_name": "First National Bank",
        "tier": "professional",
        "state": "California",
        "contact": "admin@firstnational.com",
        "calls_limit": 15000,
        "active": True,
        "onboarded": "2026-02-01",
        "cbs_provider": "fis",
    },
    "fetch1mnusswylz6smcx59jtvem2vyxruw6mjkhppyph": {
        "bank_id": "BANK002",
        "bank_name": "Demo Bank (Internal Testing)",
        "tier": "enterprise",
        "state": "New York",
        "contact": "shyamjipandey211105@gmail.com",
        "calls_limit": 40000,
        "active": True,
        "onboarded": "2026-02-20",
        "cbs_provider": "mock",
    },
}


# ─── TOKEN FUNCTIONS ──────────────────────────────────────────────────────────

def create_token(wallet_address: str, bank_profile: dict) -> str:
    """Create JWT token after wallet verification."""
    payload = {
        "wallet": wallet_address,
        "bank_id": bank_profile["bank_id"],
        "bank_name": bank_profile["bank_name"],
        "tier": bank_profile["tier"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify JWT and return payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


def get_current_bank(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """FastAPI dependency — use this on protected routes."""
    return verify_token(credentials.credentials)


# ─── WALLET VERIFICATION ──────────────────────────────────────────────────────

def verify_wallet_signature(wallet_address: str, signature: str, message: str) -> bool:
    """
    Verify that the user actually owns the FET wallet.
    PRODUCTION: Use cosmpy to verify on-chain signature.
    For now: accept any registered wallet (demo mode).
    """
    # Demo mode: just check if wallet is registered
    if os.getenv("AUTH_MODE", "demo") == "demo":
        return wallet_address in BANK_CLIENTS

    # Production: verify cryptographic signature
    try:
        from cosmpy.crypto.address import Address
        # Verify the signature proves ownership of wallet_address
        # This prevents someone from just typing another bank's wallet address
        return True  # placeholder — implement full crypto verify
    except Exception:
        return False


def login_with_wallet(wallet_address: str, signature: str = "", message: str = "") -> dict:
    """
    Main login function.
    Returns JWT token if wallet is registered and verified.
    """
    # 1. Check wallet is a registered bank client
    bank_profile = BANK_CLIENTS.get(wallet_address)
    if not bank_profile:
        raise HTTPException(
            status_code=404,
            detail="Wallet not registered. Please subscribe first or contact support."
        )

    # 2. Check bank subscription is active
    if not bank_profile["active"]:
        raise HTTPException(
            status_code=403,
            detail="Your subscription is inactive. Please renew to continue."
        )

    # 3. Verify wallet ownership
    if not verify_wallet_signature(wallet_address, signature, message):
        raise HTTPException(
            status_code=401,
            detail="Wallet verification failed. Please sign the message with your wallet."
        )

    # 4. Issue JWT
    token = create_token(wallet_address, bank_profile)

    return {
        "token": token,
        "bank_name": bank_profile["bank_name"],
        "tier": bank_profile["tier"],
        "expires_in": f"{TOKEN_EXPIRY_HOURS} hours",
    }


def register_new_bank(wallet_address: str, bank_name: str, tier: str, contact: str) -> dict:
    """
    Called automatically when a bank completes FET payment subscription.
    Adds them to BANK_CLIENTS and enables dashboard access.
    PRODUCTION: Write to PostgreSQL.
    """
    calls_limits = {"starter": 5000, "professional": 15000, "enterprise": 40000}

    BANK_CLIENTS[wallet_address] = {
        "bank_id": f"BANK{len(BANK_CLIENTS) + 1:03d}",
        "bank_name": bank_name,
        "tier": tier,
        "contact": contact,
        "calls_limit": calls_limits.get(tier, 5000),
        "active": True,
        "onboarded": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "cbs_provider": "mock",  # upgraded when they integrate CBS
        "state": "USA",
    }

    return {"registered": True, "bank_id": BANK_CLIENTS[wallet_address]["bank_id"]}