import re
from datetime import timedelta
from django.utils import timezone
from .models import LoginAttempt

COMMON_PASSWORDS = {
    "123456", "password", "12345678", "qwerty", "12345", "1234", "111111",
    "1234567", "sunshine", "qwerty123", "football", "iloveyou", "monkey",
    "1234567890", "123456789", "abcdef", "abc123", "passw0rd", "admin123",
    "letmein", "welcome", "trustno1", "dragon", "master", "login", "princess",
    "assword", "shadow", "michael", "superman", "batman", "starwars",
    "passwd", "qwertz", "123qwe", "qwe123", "1q2w3e4r", "zaq1xsw2",
}


def validate_password_strength(password: str) -> str | None:
    """Returns an error message if password is weak, None if strong."""
    if len(password) < 12:
        return "Password must be at least 12 characters long"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*()_\-+=\[\]{}|;:'\",.<>?/~`]", password):
        return "Password must contain at least one special character"
    if password.lower() in COMMON_PASSWORDS:
        return "This password is too common"
    return None


def is_rate_limited(ip_address: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    """Check if an IP has exceeded the max login attempts in the time window."""
    cutoff = timezone.now() - timedelta(minutes=window_minutes)
    recent = LoginAttempt.objects.filter(
        ip_address=ip_address,
        attempted_at__gte=cutoff,
        success=False,
    ).count()
    return recent >= max_attempts


def record_login_attempt(ip_address: str, success: bool):
    LoginAttempt.objects.create(ip_address=ip_address, success=success)
    # Cleanup old records (keep last 7 days)
    cutoff = timezone.now() - timedelta(days=7)
    LoginAttempt.objects.filter(attempted_at__lt=cutoff).delete()
