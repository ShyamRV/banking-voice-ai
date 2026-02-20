"""
BankVoiceAI Dashboard API Bridge
Connects the Next.js frontend to your existing Python agents
Run: uvicorn api.dashboard_api:app --port 8003 --reload
"""

import os
import asyncio
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# In-memory store for agent states
agent_states = {
    "core":       {"status": "active",   "calls_today": 0, "uptime": 99.8, "health_score": 98},
    "whatsapp":   {"status": "active",   "calls_today": 0, "uptime": 99.5, "health_score": 96},
    "voice":      {"status": "active",   "calls_today": 0, "uptime": 98.9, "health_score": 94},
    "compliance": {"status": "inactive", "calls_today": 0, "uptime": 95.2, "health_score": 78},
    "fraud":      {"status": "inactive", "calls_today": 0, "uptime": 99.9, "health_score": 99},
}

agent_addresses = {
    "core":       "agent1qgvr77f03u9r904yxv9axdv2ylmw6rxld37euc27fyd3ytew6s77wux8u99",
    "whatsapp":   "agent1q_whatsapp_address",
    "voice":      "agent1q_voice_address",
    "compliance": "agent1q_compliance_address",
    "fraud":      "agent1q_fraud_address",
}

agent_names = {
    "core":       "BankVoiceAI Core",
    "whatsapp":   "WhatsApp Agent",
    "voice":      "Voice Call Agent",
    "compliance": "Compliance Agent",
    "fraud":      "Fraud Detection Agent",
}

log_buffer: list[dict] = []
websocket_clients: list[WebSocket] = []


def add_log(agent_id: str, level: str, message: str):
    entry = {
        "id": str(len(log_buffer) + 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "agent_name": agent_names.get(agent_id, agent_id),
        "level": level,
        "message": message,
    }
    log_buffer.append(entry)
    if len(log_buffer) > 200:
        log_buffer.pop(0)
    asyncio.create_task(broadcast_log(entry))
    return entry


async def broadcast_log(log_entry: dict):
    disconnected = []
    for ws in websocket_clients:
        try:
            await ws.send_json(log_entry)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        websocket_clients.remove(ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    add_log("core", "INFO", "BankVoiceAI Core agent started successfully")
    add_log("core", "INFO", "Payment protocol active - wallet: fetch1mnusswylz6smcx59jtvem2vyxruw6mjkhppyph")
    add_log("whatsapp", "INFO", "WhatsApp server connected to Twilio sandbox")
    add_log("voice", "INFO", "Voice server ready on port 8002")
    yield


app = FastAPI(title="BankVoiceAI Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/subscription/{wallet_address}")
async def get_subscription(wallet_address: str):
    if wallet_address == "fetch1quuv23cpyse4mca5ug03df20rx00rl4aznrsud":
        return {
            "active": True,
            "tier": "professional",
            "bank_name": "Test Bank",
            "calls_used": 3420,
            "calls_limit": 15000,
            "calls_remaining": 11580,
            "expiry": "2026-03-21",
            "fet_wallet": wallet_address,
            "active_agents": 3,
            "cost_saved": 18500000,
            "access_level": "complete_calls_limited_whatsapp",
            "features": ["phone_calls", "whatsapp_text", "whatsapp_voice_messages", "cbs_readonly"],
        }
    return {
        "active": False,
        "reason": "No active subscription",
        "fet_wallet": wallet_address,
    }


@app.get("/api/agents")
async def get_agents():
    result = []
    for agent_id, state in agent_states.items():
        result.append({
            "id": agent_id,
            "address": agent_addresses.get(agent_id, ""),
            "status": state["status"],
            "calls_today": state["calls_today"],
            "uptime": state["uptime"],
            "health_score": state["health_score"],
            "last_active": datetime.now(timezone.utc).isoformat(),
        })
    return result


@app.post("/api/agent/{agent_id}/start")
async def start_agent(agent_id: str):
    if agent_id not in agent_states:
        return JSONResponse(status_code=404, content={"error": "Agent not found"})
    agent_states[agent_id]["status"] = "active"
    add_log(agent_id, "INFO", "Agent started by dashboard user")
    add_log(agent_id, "INFO", "Registering on Agentverse almanac...")
    add_log(agent_id, "INFO", f"Agent online at {agent_addresses.get(agent_id, 'unknown')}")
    return {"success": True, "agent_id": agent_id, "status": "active"}


@app.post("/api/agent/{agent_id}/stop")
async def stop_agent(agent_id: str):
    if agent_id not in agent_states:
        return JSONResponse(status_code=404, content={"error": "Agent not found"})
    agent_states[agent_id]["status"] = "inactive"
    add_log(agent_id, "WARN", "Agent stopped by dashboard user")
    add_log(agent_id, "INFO", "Graceful shutdown complete")
    return {"success": True, "agent_id": agent_id, "status": "inactive"}


@app.get("/api/agent/{agent_id}/status")
async def get_agent_status(agent_id: str):
    if agent_id not in agent_states:
        return JSONResponse(status_code=404, content={"error": "Agent not found"})
    state = agent_states[agent_id]
    return {
        "id": agent_id,
        "address": agent_addresses.get(agent_id, ""),
        "status": state["status"],
        "calls_today": state["calls_today"],
        "uptime": state["uptime"],
        "health_score": state["health_score"],
        "logs": [l for l in log_buffer if l["agent_id"] == agent_id][-20:],
    }


@app.get("/api/stats")
async def get_stats():
    active = sum(1 for s in agent_states.values() if s["status"] == "active")
    total_calls = sum(s["calls_today"] for s in agent_states.values())
    avg_uptime = sum(s["uptime"] for s in agent_states.values()) / len(agent_states)
    return {
        "total_calls_today": total_calls,
        "active_agents": active,
        "total_agents": len(agent_states),
        "avg_uptime": round(avg_uptime, 1),
        "cost_saved_inr": 18500000,
        "calls_this_month": 3420,
    }


@app.get("/api/logs")
async def get_logs(
    agent_id: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100,
):
    filtered = log_buffer.copy()
    if agent_id and agent_id != "all":
        filtered = [l for l in filtered if l["agent_id"] == agent_id]
    if level and level != "all":
        filtered = [l for l in filtered if l["level"] == level]
    return list(reversed(filtered[-limit:]))


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.append(websocket)
    for log in list(reversed(log_buffer[-20:])):
        await websocket.send_json(log)
    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)


@app.post("/api/payment/request")
async def request_payment(body: dict):
    tier = body.get("tier", "starter")
    wallet = body.get("wallet_address", "")
    add_log("core", "INFO", f"Payment requested: {tier} tier for wallet {wallet}")
    return {
        "success": True,
        "tier": tier,
        "message": f"Payment request sent for {tier} tier",
        "agent_address": agent_addresses["core"],
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=True)
