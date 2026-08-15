"""FastAPI application for the personal finance tracker."""

from __future__ import annotations

import logging
import os
from hashlib import sha256
from dataclasses import dataclass
from uuid import UUID

from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from supabase import Client, create_client

from gmail_client import oauth_flow, tokens_from_credentials
from utils import sign_session, verify_session

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    service_role_key: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    secret_key: str
    frontend_url: str
    session_ttl_seconds: int = 60 * 60 * 24 * 7
    cookie_secure: bool = True

    @classmethod
    def from_env(cls) -> "Settings":
        required = (
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "GOOGLE_REDIRECT_URI",
            "SECRET_KEY",
            "FRONTEND_URL",
        )
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
        return cls(
            supabase_url=os.environ["SUPABASE_URL"],
            service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
            google_client_id=os.environ["GOOGLE_CLIENT_ID"],
            google_client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
            google_redirect_uri=os.environ["GOOGLE_REDIRECT_URI"],
            secret_key=os.environ["SECRET_KEY"],
            frontend_url=os.environ["FRONTEND_URL"].rstrip("/"),
            cookie_secure=os.getenv("COOKIE_SECURE", "true").lower() == "true",
        )


settings = Settings.from_env()
db: Client = create_client(settings.supabase_url, settings.service_role_key)
app = FastAPI(title="Finance Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://anassyed-homelab.tail3bc01f.ts.net",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def current_user_id(session: str | None = Cookie(default=None, alias="finance_session")) -> UUID:
    user_id = verify_session(session, settings.secret_key)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user_id


def state_fingerprint(value: str | None) -> str:
    if not value:
        return "missing"
    return sha256(value.encode()).hexdigest()[:12]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/auth/google")
def google_login():
    flow = oauth_flow(
        settings.google_client_id,
        settings.google_client_secret,
        settings.google_redirect_uri,
    )
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    response = RedirectResponse(authorization_url, status_code=status.HTTP_302_FOUND)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    LOGGER.info("Started Google OAuth state=%s", state_fingerprint(state))
    response.set_cookie(
        "google_oauth_state",
        state,
        max_age=600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    if flow.code_verifier:
        response.set_cookie(
            "google_oauth_verifier",
            flow.code_verifier,
            max_age=600,
            httponly=True,
            secure=settings.cookie_secure,
            samesite="lax",
        )
    return response


@app.get("/auth/callback")
def google_callback(
    code: str,
    state: str,
    google_oauth_state: str | None = Cookie(default=None),
    google_oauth_verifier: str | None = Cookie(default=None),
):
    if not google_oauth_state or not state or not hmac_compare(state, google_oauth_state):
        LOGGER.warning(
            "Rejected OAuth state received=%s cookie=%s",
            state_fingerprint(state),
            state_fingerprint(google_oauth_state),
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")
    if not google_oauth_verifier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth verifier")
    flow = oauth_flow(
        settings.google_client_id,
        settings.google_client_secret,
        settings.google_redirect_uri,
    )
    try:
        flow.code_verifier = google_oauth_verifier
        # Google canonicalizes email/profile scopes to userinfo URLs.
        # Do not reject an otherwise valid code solely because of that formatting.
        flow.oauth2session.scope = None
        flow.fetch_token(code=code)
        claims = id_token.verify_oauth2_token(
            flow.credentials.id_token,
            GoogleRequest(),
            settings.google_client_id,
        )
        email = claims.get("email")
        if not email:
            raise ValueError("Google did not return an email address")
        tokens = tokens_from_credentials(flow.credentials)
        result = (
            db.table("fin_users")
            .upsert(
                {
                    "email": email,
                    "display_name": claims.get("name"),
                    "gmail_tokens": tokens,
                },
                on_conflict="email",
            )
            .execute()
        )
        if not result.data:
            raise RuntimeError("User upsert returned no row")
        user_id = UUID(result.data[0]["id"])
    except Exception as exc:
        LOGGER.exception("Google OAuth callback failed")
        raise HTTPException(status_code=502, detail="Google authentication failed") from exc
    response = RedirectResponse(settings.frontend_url, status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie("google_oauth_state")
    response.delete_cookie("google_oauth_verifier")
    response.set_cookie(
        "finance_session",
        sign_session(user_id, settings.secret_key, settings.session_ttl_seconds),
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="none",
    )
    return response


def hmac_compare(left: str, right: str) -> bool:
    import hmac

    return hmac.compare_digest(left, right)


@app.get("/api/me")
def me(user_id: UUID = Depends(current_user_id)):
    result = (
        db.table("fin_users")
        .select("id,email,display_name,gmail_tokens")
        .eq("id", str(user_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = result.data
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user.get("display_name"),
        "gmail_connected": user.get("gmail_tokens") is not None,
    }


@app.get("/api/transactions")
def transactions(
    limit: int = Query(default=100, ge=1, le=1000),
    user_id: UUID = Depends(current_user_id),
):
    result = (
        db.table("fin_transactions")
        .select("*")
        .eq("user_id", str(user_id))
        .order("transaction_date", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


@app.get("/api/balance-history")
def balance_history(user_id: UUID = Depends(current_user_id)):
    result = (
        db.table("fin_balance_history")
        .select("*")
        .eq("user_id", str(user_id))
        .order("snapshot_date", desc=True)
        .execute()
    )
    return result.data


@app.post("/api/reconnect")
def reconnect(user_id: UUID = Depends(current_user_id)):
    db.table("fin_users").update({"gmail_tokens": None}).eq("id", str(user_id)).execute()
    return RedirectResponse("/auth/google", status_code=status.HTTP_303_SEE_OTHER)
