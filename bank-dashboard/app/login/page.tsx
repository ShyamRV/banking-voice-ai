"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("demo@bankvoiceai.com")
  const [password, setPassword] = useState("Demo2026!")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return }
    setLoading(true)
    setError("")
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register"
      const body = mode === "login"
        ? { email, password }
        : { email, password, bank_credentials: {} }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || "Authentication failed"); setLoading(false); return }
      localStorage.setItem("auth_token", data.access_token)
      router.push("/dashboard/payments")
    } catch {
      setError("Cannot reach server. Check NEXT_PUBLIC_API_URL is set in Vercel.")
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        .root { min-height:100vh; background:#060608; display:flex; font-family:'DM Sans',sans-serif; color:#e8e8f0; overflow:hidden; }
        .left { flex:1; display:flex; flex-direction:column; justify-content:space-between; padding:48px; background:linear-gradient(145deg,#0d0d18 0%,#060608 60%); border-right:1px solid rgba(255,255,255,0.04); position:relative; overflow:hidden; }
        .left::before { content:''; position:absolute; top:-200px; left:-200px; width:600px; height:600px; background:radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%); pointer-events:none; }
        .left::after { content:''; position:absolute; bottom:-100px; right:-100px; width:400px; height:400px; background:radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%); pointer-events:none; }
        .grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; }
        .brand { display:flex; align-items:center; gap:12px; z-index:1; }
        .brand-icon { width:40px; height:40px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .brand-name { font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#fff; }
        .hero { z-index:1; }
        .tag { display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:100px; padding:4px 12px; font-size:11px; font-weight:500; color:#10b981; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:24px; }
        .dot { width:6px; height:6px; background:#10b981; border-radius:50%; animation:blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        .h1 { font-family:'Syne',sans-serif; font-size:52px; font-weight:800; line-height:1.05; letter-spacing:-2.5px; color:#fff; margin-bottom:20px; }
        .h1 span { background:linear-gradient(135deg,#6366f1 0%,#10b981 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .sub { font-size:15px; color:rgba(255,255,255,0.4); line-height:1.75; max-width:380px; font-weight:300; }
        .stats { display:flex; gap:32px; z-index:1; }
        .stat { display:flex; flex-direction:column; gap:4px; }
        .snum { font-family:'Syne',sans-serif; font-size:22px; font-weight:700; color:#fff; }
        .slabel { font-size:11px; color:rgba(255,255,255,0.3); letter-spacing:0.5px; text-transform:uppercase; }
        .sdiv { width:1px; background:rgba(255,255,255,0.07); }
        .right { width:480px; display:flex; align-items:center; justify-content:center; padding:48px; background:#0a0a10; }
        .card { width:100%; max-width:360px; }
        .fhead { margin-bottom:32px; }
        .ftitle { font-family:'Syne',sans-serif; font-size:26px; font-weight:700; color:#fff; margin-bottom:8px; letter-spacing:-0.5px; }
        .fsub { font-size:13px; color:rgba(255,255,255,0.32); font-weight:300; }
        .tabs { display:flex; background:rgba(255,255,255,0.04); border-radius:10px; padding:4px; margin-bottom:28px; }
        .tab { flex:1; padding:8px; text-align:center; font-size:13px; font-weight:500; border-radius:7px; cursor:pointer; transition:all 0.2s; color:rgba(255,255,255,0.35); border:none; background:transparent; font-family:'DM Sans',sans-serif; }
        .tab.on { background:rgba(255,255,255,0.08); color:#fff; }
        .field { margin-bottom:16px; }
        .flabel { display:block; font-size:11px; font-weight:500; color:rgba(255,255,255,0.35); letter-spacing:0.8px; text-transform:uppercase; margin-bottom:8px; }
        .finput { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:13px 16px; font-size:14px; color:#e8e8f0; font-family:'DM Sans',sans-serif; transition:all 0.2s; outline:none; }
        .finput:focus { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.05); }
        .finput::placeholder { color:rgba(255,255,255,0.18); }
        .err { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:10px 14px; font-size:13px; color:#f87171; margin-bottom:16px; }
        .btn { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:10px; color:#fff; font-family:'Syne',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.3px; cursor:pointer; transition:all 0.2s; margin-top:8px; }
        .btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(99,102,241,0.35); }
        .btn:disabled { opacity:0.6; cursor:not-allowed; }
        .hint { margin-top:20px; padding:12px 14px; background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.1); border-radius:8px; font-size:12px; color:rgba(255,255,255,0.3); line-height:1.6; }
        .hint strong { color:rgba(16,185,129,0.75); font-weight:500; }
        @media(max-width:768px){ .left{display:none} .right{width:100%;padding:32px 24px} }
      `}</style>

      <div className="root">
        <div className="left">
          <div className="grid" />
          <div className="brand">
            <div className="brand-icon">🏦</div>
            <span className="brand-name">BankVoiceAI</span>
          </div>
          <div className="hero">
            <div className="tag"><div className="dot" />Live on Fetch.ai Testnet</div>
            <h1 className="h1">Voice-driven<br /><span>blockchain</span><br />payments.</h1>
            <p className="sub">AI agents that listen, verify, and execute FET token transfers on the Fetch.ai network — fully automated, fully auditable.</p>
          </div>
          <div className="stats">
            <div className="stat"><span className="snum">$1.5K–6K</span><span className="slabel">Tier Range</span></div>
            <div className="sdiv" />
            <div className="stat"><span className="snum">FET</span><span className="slabel">Token</span></div>
            <div className="sdiv" />
            <div className="stat"><span className="snum">dorado-1</span><span className="slabel">Network</span></div>
          </div>
        </div>

        <div className="right">
          <div className="card">
            <div className="fhead">
              <h2 className="ftitle">{mode === "login" ? "Welcome back" : "Create account"}</h2>
              <p className="fsub">{mode === "login" ? "Sign in to your payment dashboard" : "Register to start processing payments"}</p>
            </div>

            <div className="tabs">
              <button className={`tab ${mode === "login" ? "on" : ""}`} onClick={() => { setMode("login"); setError("") }}>Sign In</button>
              <button className={`tab ${mode === "register" ? "on" : ""}`} onClick={() => { setMode("register"); setError("") }}>Register</button>
            </div>

            <div className="field">
              <label className="flabel">Email</label>
              <input className="finput" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <div className="field">
              <label className="flabel">Password</label>
              <input className="finput" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>

            {error && <div className="err">{error}</div>}

            <button className="btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Authenticating..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>

            <div className="hint">
              <strong>Demo credentials pre-filled.</strong> Click Register first on a fresh deploy, then Sign In next time.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
