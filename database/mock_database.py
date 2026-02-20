"""
BankVoiceAI - Customer Database
- Shyamji Pandey: +91 8431439772 (India demo)
- James Mitchell: +1 408-555-1234 (US - salaried)
- Sarah Johnson: +1 212-555-9876 (US - business owner)
- Robert Chen: +1 702-555-4321 (US - retiree)
- Maria Garcia: +1 310-555-7890 (US - young professional)
PRODUCTION: Replace get_customer_by_phone() with CBS API call
"""

CUSTOMERS = {

    # ── SHYAMJI PANDEY (India demo) ───────────────────────────────────────────
    "8431439772": {
        "customer_id": "CUST001",
        "name": "Shyamji Pandey",
        "phone": "8431439772",
        "email": "shyamjipandey211105@gmail.com",
        "language": "english",
        "kyc_status": "verified",
        "currency": "INR",
        "symbol": "₹",
        "accounts": {
            "SAV001": {
                "type": "savings",
                "balance": 84314.39,
                "account_number": "XXXX XXXX 7721",
                "ifsc": "SBIN0001234",
                "branch": "Bangalore Main Branch",
                "last_transaction": "2026-02-20",
            },
            "FD001": {
                "type": "fixed_deposit",
                "principal": 200000,
                "interest_rate": 7.5,
                "maturity_date": "2027-02-20",
                "maturity_amount": 215000,
            }
        },
        "loans": {
            "PL001": {
                "type": "personal_loan",
                "outstanding": 350000,
                "monthly_payment": 9800,
                "payment_due_date": "20th of every month",
                "next_payment_date": "2026-03-20",
                "interest_rate": 11.5,
                "tenure_remaining": "3 years 2 months",
            }
        },
        "transactions": [
            {"date": "2026-02-20", "description": "UPI - BankVoiceAI Demo", "amount": -500, "balance": 84314.39},
            {"date": "2026-02-19", "description": "Salary Credit - Tech Company", "amount": 125000, "balance": 84814.39},
            {"date": "2026-02-18", "description": "UPI - Swiggy", "amount": -850, "balance": -40185.61},
            {"date": "2026-02-17", "description": "EMI - Personal Loan", "amount": -9800, "balance": -39335.61},
            {"date": "2026-02-15", "description": "ATM Withdrawal", "amount": -10000, "balance": -29335.61},
        ],
        "cards": [
            {"type": "credit", "last4": "3972", "limit": 200000, "outstanding": 15400, "due_date": "2026-03-10", "status": "active"}
        ],
    },

    # ── JAMES MITCHELL (US - Salaried, San Jose CA) ───────────────────────────
    "4085551234": {
        "customer_id": "CUST002",
        "name": "James Mitchell",
        "phone": "4085551234",
        "email": "james.mitchell@gmail.com",
        "language": "english",
        "kyc_status": "verified",
        "currency": "USD",
        "symbol": "$",
        "accounts": {
            "CHK001": {
                "type": "checking",
                "balance": 12847.53,
                "account_number": "XXXX XXXX 4521",
                "routing": "021000021",
                "branch": "San Jose, CA",
                "last_transaction": "2026-02-19",
            },
            "SAV001": {
                "type": "savings",
                "balance": 45200.00,
                "account_number": "XXXX XXXX 8833",
                "routing": "021000021",
                "branch": "San Jose, CA",
                "last_transaction": "2026-02-15",
            }
        },
        "loans": {
            "MTG001": {
                "type": "mortgage",
                "outstanding": 385000,
                "monthly_payment": 2240,
                "payment_due_date": "1st of every month",
                "next_payment_date": "2026-03-01",
                "interest_rate": 6.875,
                "tenure_remaining": "27 years",
            }
        },
        "transactions": [
            {"date": "2026-02-19", "description": "Direct Deposit - Google LLC", "amount": 5840.00, "balance": 12847.53},
            {"date": "2026-02-18", "description": "Zelle - Sarah Mitchell", "amount": -200.00, "balance": 7007.53},
            {"date": "2026-02-15", "description": "AutoPay - Comcast", "amount": -89.99, "balance": 7207.53},
            {"date": "2026-02-01", "description": "Mortgage Payment", "amount": -2240.00, "balance": 7297.52},
            {"date": "2026-01-31", "description": "ATM Withdrawal", "amount": -300.00, "balance": 9537.52},
        ],
        "cards": [
            {"type": "debit", "last4": "1234", "status": "active"},
            {"type": "credit", "last4": "5566", "limit": 25000, "outstanding": 3420, "due_date": "2026-03-15", "status": "active"}
        ],
    },

    # ── SARAH JOHNSON (US - Business Owner, NYC) ──────────────────────────────
    "2125559876": {
        "customer_id": "CUST003",
        "name": "Sarah Johnson",
        "phone": "2125559876",
        "email": "sarah.johnson@johnson-consulting.com",
        "language": "english",
        "kyc_status": "verified",
        "currency": "USD",
        "symbol": "$",
        "accounts": {
            "BIZ001": {
                "type": "business_checking",
                "balance": 87340.00,
                "account_number": "XXXX XXXX 7712",
                "routing": "026009593",
                "branch": "Manhattan, NY",
                "last_transaction": "2026-02-20",
            },
            "SAV001": {
                "type": "savings",
                "balance": 124500.00,
                "account_number": "XXXX XXXX 3341",
                "routing": "026009593",
                "branch": "Manhattan, NY",
                "last_transaction": "2026-02-10",
            }
        },
        "loans": {
            "SBA001": {
                "type": "sba_loan",
                "outstanding": 185000,
                "monthly_payment": 3200,
                "payment_due_date": "15th of every month",
                "next_payment_date": "2026-03-15",
                "interest_rate": 7.25,
                "tenure_remaining": "5 years",
            },
            "LOC001": {
                "type": "line_of_credit",
                "outstanding": 45000,
                "monthly_payment": 450,
                "payment_due_date": "25th of every month",
                "next_payment_date": "2026-02-25",
                "interest_rate": 9.5,
                "tenure_remaining": "Revolving",
            }
        },
        "transactions": [
            {"date": "2026-02-20", "description": "ACH Deposit - Accenture", "amount": 24000.00, "balance": 87340.00},
            {"date": "2026-02-19", "description": "Wire - Payroll", "amount": -12500.00, "balance": 63340.00},
            {"date": "2026-02-15", "description": "SBA Loan Payment", "amount": -3200.00, "balance": 75840.00},
            {"date": "2026-02-12", "description": "Office Rent - 450 Park Ave", "amount": -8500.00, "balance": 79040.00},
            {"date": "2026-02-01", "description": "ACH Deposit - Deloitte", "amount": 18000.00, "balance": 87540.00},
        ],
        "cards": [
            {"type": "business_credit", "last4": "9901", "limit": 50000, "outstanding": 8750, "due_date": "2026-03-20", "status": "active"}
        ],
    },

    # ── ROBERT CHEN (US - Retiree, Las Vegas NV) ──────────────────────────────
    "7025554321": {
        "customer_id": "CUST004",
        "name": "Robert Chen",
        "phone": "7025554321",
        "email": "robert.chen@yahoo.com",
        "language": "english",
        "kyc_status": "verified",
        "currency": "USD",
        "symbol": "$",
        "accounts": {
            "CHK001": {
                "type": "checking",
                "balance": 8920.44,
                "account_number": "XXXX XXXX 6612",
                "routing": "322271627",
                "branch": "Las Vegas, NV",
                "last_transaction": "2026-02-18",
            },
            "SAV001": {
                "type": "savings",
                "balance": 312000.00,
                "account_number": "XXXX XXXX 4490",
                "routing": "322271627",
                "branch": "Las Vegas, NV",
                "last_transaction": "2026-02-01",
            },
            "CD001": {
                "type": "certificate_of_deposit",
                "principal": 100000,
                "interest_rate": 5.25,
                "maturity_date": "2026-08-15",
                "maturity_amount": 102625,
            }
        },
        "loans": {},
        "transactions": [
            {"date": "2026-02-18", "description": "Social Security Deposit", "amount": 2847.00, "balance": 8920.44},
            {"date": "2026-02-15", "description": "Medicare Premium AutoPay", "amount": -174.70, "balance": 6073.44},
            {"date": "2026-02-10", "description": "Pension Deposit - Boeing", "amount": 3200.00, "balance": 6248.14},
            {"date": "2026-02-05", "description": "Utility Bill - NV Energy", "amount": -187.50, "balance": 3048.14},
            {"date": "2026-02-01", "description": "HOA Fee - Sun City", "amount": -420.00, "balance": 3235.64},
        ],
        "cards": [
            {"type": "debit", "last4": "4321", "status": "active"}
        ],
    },

    # ── MARIA GARCIA (US - Young Professional, Los Angeles CA) ────────────────
    "3105557890": {
        "customer_id": "CUST005",
        "name": "Maria Garcia",
        "phone": "3105557890",
        "email": "maria.garcia@ucla.edu",
        "language": "english",
        "kyc_status": "verified",
        "currency": "USD",
        "symbol": "$",
        "accounts": {
            "CHK001": {
                "type": "checking",
                "balance": 3240.18,
                "account_number": "XXXX XXXX 2291",
                "routing": "122000247",
                "branch": "Los Angeles, CA",
                "last_transaction": "2026-02-20",
            }
        },
        "loans": {
            "SL001": {
                "type": "student_loan",
                "outstanding": 28400,
                "monthly_payment": 310,
                "payment_due_date": "10th of every month",
                "next_payment_date": "2026-03-10",
                "interest_rate": 5.05,
                "tenure_remaining": "8 years",
            },
            "AUTO001": {
                "type": "auto_loan",
                "outstanding": 18200,
                "monthly_payment": 485,
                "payment_due_date": "10th of every month",
                "next_payment_date": "2026-03-10",
                "interest_rate": 7.49,
                "tenure_remaining": "3 years 4 months",
                "vehicle": "2023 Honda Civic",
            }
        },
        "transactions": [
            {"date": "2026-02-20", "description": "Venmo - Split Rent", "amount": -850.00, "balance": 3240.18},
            {"date": "2026-02-15", "description": "Direct Deposit - UCLA Health", "amount": 4200.00, "balance": 4090.18},
            {"date": "2026-02-10", "description": "AutoPay - Student Loan", "amount": -310.00, "balance": -109.82},
            {"date": "2026-02-10", "description": "AutoPay - Auto Loan", "amount": -485.00, "balance": 200.18},
            {"date": "2026-02-08", "description": "Spotify + Netflix", "amount": -28.98, "balance": 685.18},
        ],
        "cards": [
            {"type": "secured_credit", "last4": "7890", "limit": 1500, "outstanding": 420, "due_date": "2026-03-05", "status": "active"}
        ],
    },
}

BANK_PRODUCTS = {
    "checking_account": {
        "monthly_fee": "$0 with direct deposit, else $12",
        "features": ["Free debit card", "Zelle transfers", "55,000+ fee-free ATMs", "Mobile deposit"],
    },
    "savings_account": {
        "apy": "4.75% APY",
        "minimum_balance": 0,
        "features": ["No monthly fees", "FDIC insured up to $250,000", "Automatic savings tools"],
    },
    "mortgage": {
        "rate_range": "6.5% - 7.25% APR (30-year fixed)",
        "max_amount": "$2,000,000",
        "down_payment": "As low as 3%",
        "eligibility": "Credit score 620+, DTI below 43%",
    },
    "personal_loan": {
        "rate_range": "8.99% - 24.99% APR",
        "max_amount": "$50,000",
        "max_tenure": "5 years",
        "eligibility": "Credit score 660+, income $25,000+/year",
    },
    "auto_loan": {
        "rate_range": "5.99% - 12.99% APR",
        "max_amount": "$100,000",
        "max_tenure": "7 years",
        "features": ["New and used vehicles", "Pre-approval in minutes"],
    },
    "certificate_of_deposit": {
        "rates": {"3_months": "4.75%", "6_months": "5.00%", "1_year": "5.15%", "2_years": "4.90%", "5_years": "4.50%"},
        "minimum_deposit": 1000,
        "fdic_insured": True,
    },
}


# ─── LOOKUP FUNCTIONS ─────────────────────────────────────────────────────────

def get_customer_by_phone(phone: str) -> dict | None:
    digits = "".join(filter(str.isdigit, phone))
    if digits in CUSTOMERS:
        return CUSTOMERS[digits]
    for prefix in ["91", "1"]:
        if digits.startswith(prefix):
            stripped = digits[len(prefix):]
            if stripped in CUSTOMERS:
                return CUSTOMERS[stripped]
    if len(digits) > 10:
        last10 = digits[-10:]
        if last10 in CUSTOMERS:
            return CUSTOMERS[last10]
    return None


def get_account_balance(phone: str) -> str:
    c = get_customer_by_phone(phone)
    if not c:
        return "I couldn't find your account. Please verify your registered phone number."
    s = c.get("symbol", "$")
    name = c["name"].split()[0]
    lines = [f"Hi {name}! Here are your account balances:"]
    for acc in c["accounts"].values():
        t = acc["type"]
        if t in ["checking", "savings", "business_checking"]:
            lines.append(f"• {t.replace('_',' ').title()} ({acc['account_number']}): {s}{acc['balance']:,.2f}")
        elif t == "fixed_deposit":
            lines.append(f"• Fixed Deposit: {s}{acc['principal']:,} @ {acc['interest_rate']}% (Matures: {acc['maturity_date']})")
        elif t == "certificate_of_deposit":
            lines.append(f"• CD: {s}{acc['principal']:,} @ {acc['interest_rate']}% APY (Matures: {acc['maturity_date']})")
    return "\n".join(lines)


def get_loan_status(phone: str) -> str:
    c = get_customer_by_phone(phone)
    if not c:
        return "I couldn't find your account."
    s = c.get("symbol", "$")
    name = c["name"].split()[0]
    loans = c.get("loans", {})
    if not loans:
        return f"Hi {name}! You have no active loans. Want to know about our loan products?"
    lines = [f"Hi {name}! Your active loans:"]
    for loan in loans.values():
        lines.append(
            f"• {loan['type'].replace('_',' ').title()}:\n"
            f"  Outstanding: {s}{loan['outstanding']:,}\n"
            f"  Monthly Payment: {s}{loan['monthly_payment']:,}\n"
            f"  Next Due: {loan['next_payment_date']}"
        )
    return "\n".join(lines)


def get_recent_transactions(phone: str, count: int = 5) -> str:
    c = get_customer_by_phone(phone)
    if not c:
        return "I couldn't find your account."
    s = c.get("symbol", "$")
    name = c["name"].split()[0]
    txns = c.get("transactions", [])[:count]
    if not txns:
        return f"Hi {name}! No recent transactions found."
    lines = [f"Hi {name}! Your last {len(txns)} transactions:"]
    for t in txns:
        amt = t["amount"]
        sign = "+" if amt > 0 else ""
        lines.append(f"• {t['date']}: {t['description']} — {sign}{s}{abs(amt):,.2f}")
    return "\n".join(lines)


def get_product_info(product_type: str) -> str:
    key = product_type.lower().replace(" ", "_")
    product = BANK_PRODUCTS.get(key)
    if not product:
        return f"Please contact us for details on {product_type}."
    return str(product)


def verify_customer(phone: str) -> dict:
    c = get_customer_by_phone(phone)
    if not c:
        return {"verified": False, "reason": "Phone number not registered"}
    if c["kyc_status"] != "verified":
        return {"verified": False, "reason": "KYC pending — please visit your nearest branch"}
    return {"verified": True, "customer_id": c["customer_id"], "name": c["name"], "language": c["language"]}