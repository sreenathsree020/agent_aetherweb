import re

# Luhn regex matching Visa, MasterCard, Amex, Discover
CREDIT_CARD_REGEX = re.compile(
    r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})\b'
)
CVV_REGEX = re.compile(r'\b\d{3,4}\b')
SSN_REGEX = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')


class RedactionService:
    @staticmethod
    def sanitize_text(text: str) -> str:
        """Redact credit card numbers, CVVs, and sensitive PII from speech transcripts."""
        if not text:
            return text
        sanitized = CREDIT_CARD_REGEX.sub("[CARD_REDACTED]", text)
        sanitized = SSN_REGEX.sub("[SSN_REDACTED]", sanitized)
        return sanitized

    @staticmethod
    def is_pci_sensitive(text: str) -> bool:
        """Check if customer is reading sensitive financial credentials."""
        keywords = ["credit card", "card number", "cvv", "expiration date", "expiry date", "security code"]
        return any(k in text.lower() for k in keywords)
