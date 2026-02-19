"""
Access control based on subscription tier.
Implements the 3-level access model from Phase 1 Architecture.
"""

from uagents import Context


class TierManager:
    """Manages feature access based on subscription tier."""

    def __init__(self, ctx: Context):
        self.ctx = ctx

    def get_access_level(self, user_address: str) -> str:
        """
        Get access level for user.
        Returns: "general", "limited", or "complete"
        """
        access_level = self.ctx.storage.get(f"subscription:{user_address}:access_level")

        if not access_level:
            return "general"  # No subscription = general details only

        return access_level

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

    def get_allowed_features(self, user_address: str) -> list:
        """Get list of features user can access."""
        features_str = self.ctx.storage.get(f"subscription:{user_address}:features")
        if not features_str:
            return ["basic_queries"]  # General access

        return features_str.split(",")
