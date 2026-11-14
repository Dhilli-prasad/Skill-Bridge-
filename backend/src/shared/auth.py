from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any


class UnauthorizedError(ValueError):
    """Raised when API Gateway did not provide a verified authenticated identity."""


@dataclass(frozen=True)
class AuthenticatedIdentity:
    user_id: str
    username: str | None = None
    email: str | None = None
    name: str | None = None


def _claims_from_request_context(request_context: Any) -> Mapping[str, Any] | None:
    if not isinstance(request_context, Mapping):
        return None
    authorizer = request_context.get('authorizer')
    if not isinstance(authorizer, Mapping):
        return None

    # REST API Cognito authorizers expose requestContext.authorizer.claims.
    claims = authorizer.get('claims')
    if isinstance(claims, Mapping):
        return claims

    # Keep the helper compatible with a future HTTP API JWT authorizer. This
    # still trusts only API Gateway's verified request context; it never parses
    # or verifies a token supplied by the browser.
    jwt = authorizer.get('jwt')
    if isinstance(jwt, Mapping) and isinstance(jwt.get('claims'), Mapping):
        return jwt['claims']
    return None


def get_authenticated_identity(event: Mapping[str, Any]) -> AuthenticatedIdentity:
    """Extract the authenticated Cognito subject from API Gateway context."""
    claims = _claims_from_request_context(event.get('requestContext'))
    user_id = claims.get('sub') if claims else None
    if not isinstance(user_id, str) or not user_id.strip() or len(user_id) > 256:
        raise UnauthorizedError('Authentication is required.')

    def optional_claim(name: str) -> str | None:
        value = claims.get(name) if claims else None
        return value.strip() if isinstance(value, str) and value.strip() else None

    return AuthenticatedIdentity(
        user_id=user_id.strip(),
        username=optional_claim('username') or optional_claim('cognito:username'),
        email=optional_claim('email'),
        name=optional_claim('name'),
    )
