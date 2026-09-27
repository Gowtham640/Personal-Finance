from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from utils import backfill_balances, gmail_credential_expired, gmail_credential_expires_at, sign_session, verify_session


def test_session_round_trip_and_tamper_detection():
    secret = "test-secret"
    user_id = uuid4()
    signed = sign_session(user_id, secret, 60)

    assert verify_session(signed, secret) == user_id
    assert verify_session(f"{signed}x", secret) is None


def test_backfill_balance_applies_credit_and_debit_in_date_order():
    transactions = [
        {"id": "debit", "transaction_date": date(2026, 1, 2), "amount": "10.00", "type": "debit"},
        {"id": "credit", "transaction_date": date(2026, 1, 1), "amount": "25.00", "type": "credit"},
    ]

    assert backfill_balances(Decimal("100.00"), transactions) == [
        ("credit", Decimal("125.00")),
        ("debit", Decimal("115.00")),
    ]


def test_gmail_credential_expires_five_days_after_consent_not_refresh():
    connected_at = datetime(2026, 9, 1, tzinfo=timezone.utc)
    user = {
        "gmail_tokens": {"access_token": "test"},
        "gmail_expires_at": gmail_credential_expires_at(connected_at).isoformat(),
        "expired": False,
    }
    assert not gmail_credential_expired(user, connected_at + timedelta(days=4))
    assert gmail_credential_expired(user, connected_at + timedelta(days=5))
    user["expired"] = True
    assert gmail_credential_expired(user, connected_at)
