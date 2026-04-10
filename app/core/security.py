import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone


PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 600_000


class InvalidTokenError(ValueError):
    pass


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def hash_password(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Mật khẩu cần ít nhất 8 ký tự.")

    salt = secrets.token_bytes(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return f"{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt.hex()}${derived_key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iteration_text, salt_hex, password_hex = stored_hash.split("$", 3)
        if algorithm != PBKDF2_ALGORITHM:
            return False

        iterations = int(iteration_text)
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(password_hex)
    except (TypeError, ValueError):
        return False

    candidate_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(candidate_hash, expected_hash)


def create_access_token(
    *,
    subject: str,
    email: str,
    role: str,
    secret_key: str,
    algorithm: str,
    expires_minutes: int,
) -> str:
    if algorithm != "HS256":
        raise ValueError("Chỉ hỗ trợ thuật toán HS256 cho access token.")

    header = {"alg": algorithm, "typ": "JWT"}
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }

    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(secret_key.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()

    return f"{signing_input}.{_b64url_encode(signature)}"


def decode_access_token(*, token: str, secret_key: str, algorithm: str) -> dict[str, object]:
    if algorithm != "HS256":
        raise InvalidTokenError("Thuật toán token không được hỗ trợ.")

    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", 2)
    except ValueError as exc:
        raise InvalidTokenError("Token không đúng định dạng.") from exc

    signing_input = f"{encoded_header}.{encoded_payload}"
    expected_signature = hmac.new(secret_key.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()

    try:
        actual_signature = _b64url_decode(encoded_signature)
        header = json.loads(_b64url_decode(encoded_header))
        payload = json.loads(_b64url_decode(encoded_payload))
    except (json.JSONDecodeError, ValueError) as exc:
        raise InvalidTokenError("Không thể giải mã token.") from exc

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise InvalidTokenError("Chữ ký token không hợp lệ.")

    if header.get("alg") != algorithm:
        raise InvalidTokenError("Thuật toán token không hợp lệ.")

    expires_at = payload.get("exp")
    subject = payload.get("sub")
    if not isinstance(expires_at, int) or not isinstance(subject, str) or not subject:
        raise InvalidTokenError("Payload token không hợp lệ.")

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if expires_at <= now_ts:
        raise InvalidTokenError("Token đã hết hạn.")

    return payload
