"""
BankVoiceAI - Core Banking System (CBS) Integration
Currently uses mock database. 
PRODUCTION: Each US bank gets their own adapter class.
Supported: FIS, Fiserv, Jack Henry, Temenos, Finacle
"""

import os
import logging
from abc import ABC, abstractmethod
from database.mock_database import (
    get_customer_by_phone,
    get_account_balance,
    get_loan_status,
    get_recent_transactions,
    get_product_info,
    verify_customer,
    BANK_PRODUCTS,
)

logger = logging.getLogger(__name__)


# ─── BASE CBS ADAPTER (all bank adapters inherit this) ────────────────────────

class CBSAdapter(ABC):
    """
    Abstract base class for all CBS integrations.
    Every US bank CBS must implement these methods.
    """

    @abstractmethod
    def get_customer(self, phone: str) -> dict | None:
        pass

    @abstractmethod
    def get_balance(self, phone: str) -> str:
        pass

    @abstractmethod
    def get_transactions(self, phone: str, count: int = 5) -> str:
        pass

    @abstractmethod
    def get_loan_details(self, phone: str) -> str:
        pass

    @abstractmethod
    def verify_identity(self, phone: str) -> dict:
        pass

    @abstractmethod
    def get_product_rates(self, product: str) -> str:
        pass


# ─── MOCK CBS ADAPTER (used now for demos and testing) ────────────────────────

class MockCBSAdapter(CBSAdapter):
    """
    Uses the mock customer database.
    Replace with real adapter when signing a bank client.
    """

    def get_customer(self, phone: str) -> dict | None:
        return get_customer_by_phone(phone)

    def get_balance(self, phone: str) -> str:
        return get_account_balance(phone)

    def get_transactions(self, phone: str, count: int = 5) -> str:
        return get_recent_transactions(phone, count)

    def get_loan_details(self, phone: str) -> str:
        return get_loan_status(phone)

    def verify_identity(self, phone: str) -> dict:
        return verify_customer(phone)

    def get_product_rates(self, product: str) -> str:
        return get_product_info(product)


# ─── FIS ADAPTER (largest US bank CBS) ───────────────────────────────────────

class FISAdapter(CBSAdapter):
    """
    FIS Modern Banking Platform adapter.
    Used by: Bank of America, Wells Fargo, many US community banks.
    Docs: https://developer.fisglobal.com
    """

    def __init__(self, api_key: str, base_url: str, bank_code: str):
        self.api_key = api_key
        self.base_url = base_url
        self.bank_code = bank_code
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Bank-Code": bank_code,
        }

    def _call(self, endpoint: str, params: dict = {}) -> dict:
        import requests
        try:
            r = requests.get(
                f"{self.base_url}/{endpoint}",
                headers=self.headers,
                params=params,
                timeout=5,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"FIS API error: {e}")
            return {}

    def get_customer(self, phone: str) -> dict | None:
        data = self._call("customers/search", {"phone": phone})
        if not data.get("customers"):
            return None
        c = data["customers"][0]
        return {
            "customer_id": c["customerId"],
            "name": c["fullName"],
            "phone": phone,
            "kyc_status": "verified" if c["kycStatus"] == "APPROVED" else "pending",
            "language": "english",
        }

    def get_balance(self, phone: str) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "I couldn't find your account. Please visit your nearest branch."
        data = self._call(f"accounts/{customer['customer_id']}/balances")
        if not data.get("accounts"):
            return "Unable to retrieve balance at this time."
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your account balances:"]
        for acc in data["accounts"]:
            lines.append(f"• {acc['accountType']} ({acc['maskedNumber']}): ${acc['availableBalance']:,.2f}")
        return "\n".join(lines)

    def get_transactions(self, phone: str, count: int = 5) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Unable to retrieve transactions."
        data = self._call(f"accounts/{customer['customer_id']}/transactions", {"limit": count})
        txns = data.get("transactions", [])
        if not txns:
            return "No recent transactions found."
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your last {len(txns)} transactions:"]
        for t in txns:
            amt = t["amount"]
            sign = "+" if amt > 0 else ""
            lines.append(f"• {t['date']}: {t['description']} — {sign}${abs(amt):,.2f}")
        return "\n".join(lines)

    def get_loan_details(self, phone: str) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Unable to retrieve loan details."
        data = self._call(f"loans/{customer['customer_id']}")
        loans = data.get("loans", [])
        if not loans:
            return "You don't have any active loans. Would you like to explore our loan products?"
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your active loans:"]
        for loan in loans:
            lines.append(
                f"• {loan['loanType']}:\n"
                f"  Outstanding: ${loan['outstandingBalance']:,.2f}\n"
                f"  Monthly Payment: ${loan['monthlyPayment']:,.2f}\n"
                f"  Next Due: {loan['nextPaymentDate']}"
            )
        return "\n".join(lines)

    def verify_identity(self, phone: str) -> dict:
        customer = self.get_customer(phone)
        if not customer:
            return {"verified": False, "reason": "Phone not registered"}
        return {
            "verified": customer["kyc_status"] == "verified",
            "customer_id": customer["customer_id"],
            "name": customer["name"],
            "language": customer["language"],
        }

    def get_product_rates(self, product: str) -> str:
        data = self._call("products/rates", {"type": product})
        if not data.get("rates"):
            return get_product_info(product)  # fallback to mock
        return str(data["rates"])


# ─── FISERV ADAPTER ───────────────────────────────────────────────────────────

class FiservAdapter(CBSAdapter):
    """
    Fiserv DNA / Signature adapter.
    Used by: Chase, US Bank, thousands of US community banks.
    Docs: https://developer.fiserv.com
    """

    def __init__(self, api_key: str, api_secret: str, base_url: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url

    def _get_token(self) -> str:
        import requests, base64
        credentials = base64.b64encode(f"{self.api_key}:{self.api_secret}".encode()).decode()
        r = requests.post(
            f"{self.base_url}/oauth/token",
            headers={"Authorization": f"Basic {credentials}"},
            data={"grant_type": "client_credentials"},
        )
        return r.json().get("access_token", "")

    def _call(self, endpoint: str, params: dict = {}) -> dict:
        import requests
        try:
            token = self._get_token()
            r = requests.get(
                f"{self.base_url}/v1/{endpoint}",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
                timeout=5,
            )
            return r.json()
        except Exception as e:
            logger.error(f"Fiserv API error: {e}")
            return {}

    def get_customer(self, phone: str) -> dict | None:
        data = self._call("party/search", {"phoneNumber": phone})
        party = data.get("party")
        if not party:
            return None
        return {
            "customer_id": party["partyId"],
            "name": f"{party['firstName']} {party['lastName']}",
            "phone": phone,
            "kyc_status": "verified",
            "language": "english",
        }

    def get_balance(self, phone: str) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Account not found."
        data = self._call(f"account/summary/{customer['customer_id']}")
        accounts = data.get("accounts", [])
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your balances:"]
        for acc in accounts:
            lines.append(f"• {acc['accountType']}: ${acc['currentBalance']:,.2f}")
        return "\n".join(lines)

    def get_transactions(self, phone: str, count: int = 5) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Unable to retrieve transactions."
        data = self._call(f"account/transactions/{customer['customer_id']}", {"pageSize": count})
        txns = data.get("transactions", [])
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Recent transactions:"]
        for t in txns:
            lines.append(f"• {t['postDate']}: {t['description']} — ${t['amount']:,.2f}")
        return "\n".join(lines)

    def get_loan_details(self, phone: str) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Unable to retrieve loan details."
        data = self._call(f"loan/summary/{customer['customer_id']}")
        loans = data.get("loans", [])
        if not loans:
            return "No active loans found."
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your loans:"]
        for loan in loans:
            lines.append(f"• {loan['loanType']}: ${loan['principalBalance']:,.2f} outstanding")
        return "\n".join(lines)

    def verify_identity(self, phone: str) -> dict:
        customer = self.get_customer(phone)
        if not customer:
            return {"verified": False, "reason": "Not found"}
        return {"verified": True, "customer_id": customer["customer_id"], "name": customer["name"], "language": "english"}

    def get_product_rates(self, product: str) -> str:
        return get_product_info(product)


# ─── JACK HENRY ADAPTER ───────────────────────────────────────────────────────

class JackHenryAdapter(CBSAdapter):
    """
    Jack Henry SilverLake / Symitar adapter.
    Used by: Community banks and credit unions across USA.
    Docs: https://developer.jackhenry.com
    """

    def __init__(self, api_key: str, base_url: str, institution_id: str):
        self.api_key = api_key
        self.base_url = base_url
        self.institution_id = institution_id

    def _call(self, endpoint: str, params: dict = {}) -> dict:
        import requests
        try:
            r = requests.get(
                f"{self.base_url}/{endpoint}",
                headers={
                    "jha-api-key": self.api_key,
                    "Institution-Id": self.institution_id,
                },
                params=params,
                timeout=5,
            )
            return r.json()
        except Exception as e:
            logger.error(f"Jack Henry API error: {e}")
            return {}

    def get_customer(self, phone: str) -> dict | None:
        data = self._call("members/lookup", {"phone": phone})
        member = data.get("member")
        if not member:
            return None
        return {
            "customer_id": member["memberId"],
            "name": member["memberName"],
            "phone": phone,
            "kyc_status": "verified",
            "language": "english",
        }

    def get_balance(self, phone: str) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Member not found."
        data = self._call(f"members/{customer['customer_id']}/accounts")
        accounts = data.get("accounts", [])
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your account balances:"]
        for acc in accounts:
            lines.append(f"• {acc['shareType']}: ${acc['balance']:,.2f}")
        return "\n".join(lines)

    def get_transactions(self, phone: str, count: int = 5) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Unable to retrieve transactions."
        data = self._call(f"members/{customer['customer_id']}/transactions", {"limit": count})
        txns = data.get("transactions", [])
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Recent activity:"]
        for t in txns:
            lines.append(f"• {t['date']}: {t['description']} — ${t['amount']:,.2f}")
        return "\n".join(lines)

    def get_loan_details(self, phone: str) -> str:
        customer = self.get_customer(phone)
        if not customer:
            return "Unable to retrieve loan details."
        data = self._call(f"members/{customer['customer_id']}/loans")
        loans = data.get("loans", [])
        if not loans:
            return "No active loans found."
        name = customer["name"].split()[0]
        lines = [f"Hi {name}! Your loans:"]
        for loan in loans:
            lines.append(f"• {loan['loanType']}: ${loan['balance']:,.2f} — Payment: ${loan['payment']:,.2f}/month")
        return "\n".join(lines)

    def verify_identity(self, phone: str) -> dict:
        customer = self.get_customer(phone)
        if not customer:
            return {"verified": False, "reason": "Member not found"}
        return {"verified": True, "customer_id": customer["customer_id"], "name": customer["name"], "language": "english"}

    def get_product_rates(self, product: str) -> str:
        return get_product_info(product)


# ─── CBS FACTORY (picks the right adapter per bank) ──────────────────────────

class CBSFactory:
    """
    Returns the correct CBS adapter based on environment config.
    Banks set CBS_PROVIDER in their .env when they onboard.
    """

    @staticmethod
    def get_adapter() -> CBSAdapter:
        provider = os.getenv("CBS_PROVIDER", "mock").lower()

        if provider == "fis":
            return FISAdapter(
                api_key=os.getenv("FIS_API_KEY", ""),
                base_url=os.getenv("FIS_BASE_URL", ""),
                bank_code=os.getenv("FIS_BANK_CODE", ""),
            )

        if provider == "fiserv":
            return FiservAdapter(
                api_key=os.getenv("FISERV_API_KEY", ""),
                api_secret=os.getenv("FISERV_API_SECRET", ""),
                base_url=os.getenv("FISERV_BASE_URL", ""),
            )

        if provider == "jackhenry":
            return JackHenryAdapter(
                api_key=os.getenv("JACKHENRY_API_KEY", ""),
                base_url=os.getenv("JACKHENRY_BASE_URL", ""),
                institution_id=os.getenv("JACKHENRY_INSTITUTION_ID", ""),
            )

        # Default: mock (for demo and testing)
        logger.info("CBS_PROVIDER not set — using MockCBSAdapter")
        return MockCBSAdapter()


# Singleton — one adapter instance for the whole app
cbs = CBSFactory.get_adapter()