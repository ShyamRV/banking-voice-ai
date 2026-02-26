import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import jwt
from passlib.context import CryptContext
import httpx

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Settings ─────────────────────────────────────────────────────────────────
class Settings(BaseSettings):
    app_env: str = "development"
    jwt_secret: str = "your-super-secret-jwt-key-change-in-production"
    jwt_expire_hours: int = 24
    cors_origins: str = "*"
    fetch_network: str = "testnet"
    fetch_chain_id: str = "dorado-1"
    fetch_rpc_url: str = "https://rpc-dorado.fetch.ai:443"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Banking Voice AI - Payment API",
    description="Blockchain payment system for Banking Voice AI",
    version="2.0.0",
)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Security ──────────────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

# ── In-Memory Store (replaces DB for now) ────────────────────────────────────
users_db: dict = {}          # email -> user dict
transactions_db: dict = {}   # tx_id -> tx dict


# ── Enums & Models ────────────────────────────────────────────────────────────
class SubscriptionTier(str, Enum):
    tier_1500 = "1500"
    tier_3000 = "3000"
    tier_6000 = "6000"

class TransactionStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class UserRegister(BaseModel):
    email: str
    password: str
    bank_credentials: dict = {}

class UserLogin(BaseModel):
    email: str
    password: str

class PaymentRequest(BaseModel):
    recipient_address: str
    amount: float = Field(..., gt=0)
    subscription_tier: Optional[SubscriptionTier] = SubscriptionTier.tier_3000

class CommitPayment(BaseModel):
    transaction_id: str
    transaction_hash: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    transaction_hash: Optional[str]
    sender_address: str
    recipient_address: str
    amount: float
    status: str
    created_at: str
    completed_at: Optional[str]


# ── Auth Helpers ─────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization required")
    payload = decode_token(credentials.credentials)
    user_id = payload.get("user_id")
    email = payload.get("email")
    if not user_id or email not in users_db:
        raise HTTPException(status_code=401, detail="User not found")
    return users_db[email]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "service": "payment-system-api"}

@app.get("/")
def root():
    return {"message": "Banking Voice AI Payment API", "version": "2.0.0", "docs": "/docs"}


# Auth
@app.post("/api/v1/auth/register", response_model=TokenResponse)
def register(data: UserRegister):
    if data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    users_db[data.email] = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "bank_credentials": data.bank_credentials,
        "created_at": datetime.utcnow().isoformat(),
        "subscription_tier": "3000",
    }
    token = create_token(user_id, data.email)
    return TokenResponse(access_token=token, expires_in=settings.jwt_expire_hours * 3600)

@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(data: UserLogin):
    user = users_db.get(data.email)
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], data.email)
    return TokenResponse(access_token=token, expires_in=settings.jwt_expire_hours * 3600)


# Payments
@app.post("/api/v1/payments/request", response_model=TransactionResponse)
def request_payment(data: PaymentRequest, user: dict = Depends(get_current_user)):
    tx_id = str(uuid.uuid4())
    tx = {
        "id": tx_id,
        "user_id": user["id"],
        "transaction_hash": None,
        "sender_address": f"fetch1{user['id'][:8]}...",
        "recipient_address": data.recipient_address,
        "amount": data.amount,
        "status": TransactionStatus.pending,
        "subscription_tier": data.subscription_tier,
        "created_at": datetime.utcnow().isoformat(),
        "completed_at": None,
    }
    transactions_db[tx_id] = tx
    logger.info(f"Payment requested: {tx_id} for {data.amount} FET")
    return TransactionResponse(**tx)

@app.post("/api/v1/payments/commit", response_model=TransactionResponse)
def commit_payment(data: CommitPayment, user: dict = Depends(get_current_user)):
    tx = transactions_db.get(data.transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    tx["transaction_hash"] = data.transaction_hash
    tx["status"] = TransactionStatus.completed
    tx["completed_at"] = datetime.utcnow().isoformat()
    logger.info(f"Payment committed: {data.transaction_id}")
    return TransactionResponse(**tx)

@app.post("/api/v1/payments/cancel/{transaction_id}", response_model=TransactionResponse)
def cancel_payment(transaction_id: str, user: dict = Depends(get_current_user)):
    tx = transactions_db.get(transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    tx["status"] = TransactionStatus.cancelled
    return TransactionResponse(**tx)

@app.get("/api/v1/payments/history", response_model=List[TransactionResponse])
def payment_history(limit: int = 50, offset: int = 0, user: dict = Depends(get_current_user)):
    user_txs = [tx for tx in transactions_db.values() if tx["user_id"] == user["id"]]
    user_txs.sort(key=lambda x: x["created_at"], reverse=True)
    return [TransactionResponse(**tx) for tx in user_txs[offset: offset + limit]]

@app.get("/api/v1/payments/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str, user: dict = Depends(get_current_user)):
    tx = transactions_db.get(transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return TransactionResponse(**tx)


# Dashboard stats
@app.get("/api/v1/dashboard/stats")
def dashboard_stats(user: dict = Depends(get_current_user)):
    user_txs = [tx for tx in transactions_db.values() if tx["user_id"] == user["id"]]
    total = len(user_txs)
    completed = sum(1 for tx in user_txs if tx["status"] == TransactionStatus.completed)
    pending = sum(1 for tx in user_txs if tx["status"] == TransactionStatus.pending)
    failed = sum(1 for tx in user_txs if tx["status"] == TransactionStatus.failed)
    volume = sum(tx["amount"] for tx in user_txs if tx["status"] == TransactionStatus.completed)
    return {
        "total_transactions": total,
        "completed": completed,
        "pending": pending,
        "failed": failed,
        "total_volume": round(volume, 2),
        "success_rate": round((completed / total * 100) if total > 0 else 0, 1),
    }

# Subscriptions
@app.get("/api/v1/subscriptions")
def get_subscriptions(user: dict = Depends(get_current_user)):
    return {
        "current_tier": user.get("subscription_tier", "3000"),
        "available_tiers": [
            {"id": "1500", "name": "Starter", "price": 1500, "features": ["Basic payments", "100 tx/month"]},
            {"id": "3000", "name": "Professional", "price": 3000, "features": ["Advanced payments", "500 tx/month", "Priority support"]},
            {"id": "6000", "name": "Enterprise", "price": 6000, "features": ["Unlimited payments", "Unlimited tx", "Dedicated support", "Custom integrations"]},
        ]
    }
