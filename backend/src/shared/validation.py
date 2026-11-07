from collections.abc import Mapping
from typing import Any


class ValidationError(ValueError):
    """Raised when an API request does not satisfy its contract."""


def require_json_object(body: Any) -> Mapping[str, Any]:
    if not isinstance(body, Mapping):
        raise ValidationError("Request body must be a JSON object.")
    return body


def require_string(payload: Mapping[str, Any], field: str, *, max_length: int = 256) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{field} must be a non-empty string.")
    if len(value) > max_length:
        raise ValidationError(f"{field} must be {max_length} characters or fewer.")
    return value.strip()
