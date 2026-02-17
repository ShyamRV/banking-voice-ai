import re

class RBIValidator:
    # Keywords that should NEVER appear in responses
    FORBIDDEN_TERMS = [
        'password', 'pin', 'cvv', 'otp', 'full account number',
        'secret', 'confidential'
    ]

    ESCALATION_TRIGGERS = [
        'fraud', 'scam', 'stolen', 'complaint', 'legal',
        'angry', 'manager', 'human', 'agent', 'RBI'
    ]

    MANDATORY_DISCLOSURE = (
        'Namaste! This is an AI assistant. Your call may be recorded. '
        'Say agent anytime to speak with a human.'
    )

    @classmethod
    def is_safe_response(cls, response: str) -> bool:
        lower = response.lower()
        return not any(term in lower for term in cls.FORBIDDEN_TERMS)

    @classmethod
    def needs_escalation(cls, user_input: str) -> bool:
        lower = user_input.lower()
        return any(kw in lower for kw in cls.ESCALATION_TRIGGERS)

    @classmethod
    def sanitize(cls, response: str) -> str:
        # Mask any account numbers that slip through
        response = re.sub(r'\b(\d{4})\d{8,12}(\d{4})\b',
                          r'\1XXXX\2', response)
        return response
if __name__ == '__main__':
    v = RBIValidator()
    print(v.is_safe_response('Your balance is Rs. 5,000'))  # True
    print(v.is_safe_response('Your password is 1234'))      # False
    print(v.needs_escalation('I want to speak to a manager'))# True


