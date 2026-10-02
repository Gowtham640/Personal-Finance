import base64
from datetime import datetime, timezone

from google.oauth2.credentials import Credentials

from gmail_client import (
    classify_hdfc_message,
    is_expired,
    normalize_expiry,
    parse_balance_message,
    parse_finance_message,
)


def hdfc_message(body: str, subject: str = "HDFC alert") -> dict:
    encoded_body = base64.urlsafe_b64encode(body.encode()).decode()
    return {
        "id": "deposit-message-id",
        "internalDate": "1790988480000",
        "payload": {
            "headers": [
                {"name": "From", "value": "HDFC Bank InstaAlerts <alerts@hdfcbank.bank.in>"},
                {"name": "Subject", "value": subject},
            ],
            "mimeType": "text/plain",
            "body": {"data": encoded_body},
        },
    }


def test_normalize_expiry_adds_utc_to_naive_values():
    expiry = normalize_expiry("2026-08-15T12:00:00")

    assert expiry == datetime(2026, 8, 15, 12, tzinfo=timezone.utc)


def test_normalize_expiry_converts_aware_values_to_utc():
    expiry = normalize_expiry("2026-08-15T17:30:00+05:30")

    assert expiry == datetime(2026, 8, 15, 12, tzinfo=timezone.utc)


def test_is_expired_handles_naive_credentials_expiry():
    credentials = Credentials(token="test")
    credentials.expiry = datetime(2020, 1, 1)

    assert is_expired(credentials) is True
    assert credentials.expiry.tzinfo == timezone.utc


def test_deposit_email_is_classified_before_balance_or_credit():
    message = hdfc_message(
        """
        You have received a credit in your HDFC Bank account.
        Amount received: INR 5,000.00
        Date: 02-OCT-2026
        Reference Details: XXXXXXXXXX1035 NET BANKING SI -grtxfr
        Available Balance: INR 19,711.92
        """
    )

    assert classify_hdfc_message(message) == "deposit"


def test_deposit_email_produces_credit_and_balance_records():
    message = hdfc_message(
        """
        Dear Customer,
        You have received a credit in your HDFC Bank account.
        Details of the transaction:
        Amount received: INR 5,000.00
        Account: XX2801
        Date: 02-OCT-2026
        Reference Details: XXXXXXXXXX1035 NET BANKING SI -grtxfr
        Available Balance: INR 19,711.92
        """
    )

    transaction = parse_finance_message(message)
    balance = parse_balance_message(message)

    assert transaction == {
        "unique_ref": "XXXXXXXXXX1035 NET BANKING SI -grtxfr",
        "transaction_date": "2026-10-02",
        "amount": "5000.00",
        "type": "credit",
        "merchant": None,
        "description": "HDFC alert",
        "email_timestamp": "2026-10-03T00:48:00+00:00",
    }
    assert balance == {
        "snapshot_date": "2026-10-02T00:00:00+00:00",
        "balance": "19711.92",
        "email_timestamp": "2026-10-03T00:48:00+00:00",
    }


def test_deposit_email_without_received_amount_is_not_a_transaction():
    message = hdfc_message(
        """
        You have received a credit in your HDFC Bank account.
        Amount received: INR not-a-number
        Available Balance: INR 19,711.92
        """
    )

    assert classify_hdfc_message(message) == "deposit"
    assert parse_finance_message(message) is None
