import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_agent,
)
from app.database import User

# Mock settings for consistent JWT testing
class MockSettings:
    secret_key = "test-secret-key"
    access_token_expire_minutes = 15

@pytest.fixture
def settings():
    return MockSettings()

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = "user-123"
    user.email = "test@example.com"
    user.account_type = "agent"
    return user

@pytest.fixture
def mock_db():
    return MagicMock()

# --- Password Utility Tests ---

def test_hash_password_creates_hash():
    password = "mysecurepassword"
    hashed = hash_password(password)
    assert hashed != password
    assert len(hashed) > 0

def test_verify_password_success():
    password = "mysecurepassword"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True

def test_verify_password_failure():
    password = "mysecurepassword"
    hashed = hash_password(password)
    assert verify_password("wrongpassword", hashed) is False

# --- Token Generation Tests ---

def test_create_access_token_valid(settings):
    with patch("app.auth.settings", settings):
        subject = "user-123"
        token = create_access_token(subject)

        # Decode and verify
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        assert payload["sub"] == subject
        assert "exp" in payload

def test_create_access_token_with_extra(settings):
    with patch("app.auth.settings", settings):
        subject = "user-123"
        extra = {"role": "admin", "tenant": "landfello"}
        token = create_access_token(subject, extra=extra)

        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        assert payload["sub"] == subject
        assert payload["role"] == "admin"
        assert payload["tenant"] == "landfello"

# --- User Retrieval Tests (get_current_user) ---

def test_get_current_user_missing_credentials(mock_db):
    with pytest.raises(HTTPException) as exc:
        get_current_user(credentials=None, db=mock_db)
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc.value.detail == "Authentication required"

def test_get_current_user_invalid_token(mock_db, settings):
    with patch("app.auth.settings", settings):
        # Token signed with wrong key or malformed
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token")
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=credentials, db=mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid or expired token" in exc.value.detail

def test_get_current_user_expired_token(mock_db, settings):
    with patch("app.auth.settings", settings):
        # Create an expired token
        expire = datetime.now(timezone.utc) - timedelta(minutes=1)
        payload = {"sub": "user-123", "exp": expire}
        token = jwt.encode(payload, settings.secret_key, algorithm="HS256")

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=credentials, db=mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid or expired token" in exc.value.detail

def test_get_current_user_user_not_found(mock_db, settings, mock_user):
    with patch("app.auth.settings", settings):
        # Valid token, but user not in DB
        token = create_access_token(mock_user.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Mock DB to return None
        mock_db.query().filter().first.return_value = None

        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=credentials, db=mock_db)
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc.value.detail == "User not found"

def test_get_current_user_success(mock_db, settings, mock_user):
    with patch("app.auth.settings", settings):
        token = create_access_token(mock_user.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Mock DB to return the user
        mock_db.query().filter().first.return_value = mock_user

        user = get_current_user(credentials=credentials, db=mock_db)
        assert user == mock_user
        assert user.id == "user-123"

# --- Role Authorization Tests (require_agent) ---

def test_require_agent_success(mock_user):
    # User is an agent
    mock_user.account_type = "agent"
    user = require_agent(user=mock_user)
    assert user == mock_user

def test_require_agent_forbidden(mock_user):
    # User is NOT an agent (e.g., investor)
    mock_user.account_type = "investor"
    with pytest.raises(HTTPException) as exc:
        require_agent(user=mock_user)
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc.value.detail == "Agent account required"
