"""
Access Control Manager - Tiered Feature Access
Implements the 3-level access model from Phase 1 Architecture
"""

from uagents import Context


class TierManager:
    """Manages feature access based on subscription tier."""

    ACCESS_LEVELS = {
        "general": {
            "name": "General Details",
            "description": "Public information only, no CBS access",
            "color": "red",
        },
        "limited": {
            "name": "Limited Access",
            "description": "WhatsApp only, basic queries, no CBS",
            "color": "yellow",
        },
        "complete_calls_limited_whatsapp": {
            "name": "Complete Access (Phone) + Limited (WhatsApp)",
            "description": "Phone calls enabled, read-only CBS, customer records",
            "color": "blue",
        },
        "complete": {
            "name": "Complete Access",
            "description": "Full system access - CBS, Loans, Fraud Detection",
            "color": "green",
        },
    }

    def __init__(self, ctx: Context):
        self.ctx = ctx

    def get_access_level(self, user_address: str) -> str:
        """
        Get access level for user.
        Returns: "general", "limited", "complete_calls_limited_whatsapp", or "complete"
        """
        access_level = self.ctx.storage.get(f"subscription:{user_address}:access_level")

        if not access_level:
            return "general"  # No subscription = general details only

        return access_level

    def get_tier_name(self, user_address: str) -> str:
        """Get subscription tier name."""
        tier = self.ctx.storage.get(f"subscription:{user_address}:tier")
        return tier or "none"

    def can_access_cbs(self, user_address: str, operation: str = "read") -> bool:
        """
        Check if user can access Core Banking System.
        operation: "read" or "write"
        """
        access_level = self.get_access_level(user_address)

        if operation == "read":
            # Professional+ can read CBS
            return access_level in ["complete_calls_limited_whatsapp", "complete"]
        elif operation == "write":
            # Only Enterprise can write to CBS
            return access_level == "complete"

        return False

    def can_use_phone_calls(self, user_address: str) -> bool:
        """Check if user can make/receive phone calls."""
        access_level = self.get_access_level(user_address)
        # Professional+ has phone call access
        return access_level in ["complete_calls_limited_whatsapp", "complete"]

    def can_use_whatsapp(self, user_address: str) -> bool:
        """Check if user can use WhatsApp messaging."""
        access_level = self.get_access_level(user_address)
        # All paid tiers have WhatsApp
        return access_level != "general"

    def can_access_customer_records(self, user_address: str) -> bool:
        """Check if user can access Customer Records Management."""
        access_level = self.get_access_level(user_address)
        # Professional+ can access customer records
        return access_level in ["complete_calls_limited_whatsapp", "complete"]

    def can_access_loan_system(self, user_address: str) -> bool:
        """Check if user can access Loan Management System."""
        access_level = self.get_access_level(user_address)
        # Only Enterprise tier
        return access_level == "complete"

    def can_access_fraud_detection(self, user_address: str) -> bool:
        """Check if user can access Fraud Detection system."""
        access_level = self.get_access_level(user_address)
        # Only Enterprise tier
        return access_level == "complete"

    def can_use_sms(self, user_address: str) -> bool:
        """Check if user can send SMS."""
        access_level = self.get_access_level(user_address)
        # Only Enterprise tier
        return access_level == "complete"

    def get_allowed_features(self, user_address: str) -> list:
        """Get list of features user can access."""
        features_str = self.ctx.storage.get(f"subscription:{user_address}:features")
        if not features_str:
            return ["basic_queries"]  # General access

        return features_str.split(",")

    def get_access_summary(self, user_address: str) -> dict:
        """Get complete access summary for user."""
        access_level = self.get_access_level(user_address)
        tier = self.get_tier_name(user_address)
        features = self.get_allowed_features(user_address)

        access_info = self.ACCESS_LEVELS.get(
            access_level, self.ACCESS_LEVELS["general"]
        )

        return {
            "tier": tier,
            "access_level": access_level,
            "access_name": access_info["name"],
            "description": access_info["description"],
            "features": features,
            "permissions": {
                "phone_calls": self.can_use_phone_calls(user_address),
                "whatsapp": self.can_use_whatsapp(user_address),
                "sms": self.can_use_sms(user_address),
                "cbs_read": self.can_access_cbs(user_address, "read"),
                "cbs_write": self.can_access_cbs(user_address, "write"),
                "customer_records": self.can_access_customer_records(user_address),
                "loan_system": self.can_access_loan_system(user_address),
                "fraud_detection": self.can_access_fraud_detection(user_address),
            },
        }

    def log_access_attempt(
        self, user_address: str, feature: str, allowed: bool
    ) -> None:
        """Log access attempt for audit trail."""
        timestamp = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
        log_entry = f"{timestamp}|{user_address}|{feature}|{'ALLOWED' if allowed else 'DENIED'}"

        # Store in access log
        log_key = f"access_log:{user_address}"
        current_log = self.ctx.storage.get(log_key) or ""
        new_log = f"{current_log}\n{log_entry}" if current_log else log_entry

        # Keep last 100 entries
        lines = new_log.split("\n")
        if len(lines) > 100:
            lines = lines[-100:]
            new_log = "\n".join(lines)

        self.ctx.storage.set(log_key, new_log)

        if not allowed:
            self.ctx.logger.warning(
                f"⛔ Access denied: {user_address} attempted to use {feature}"
            )
