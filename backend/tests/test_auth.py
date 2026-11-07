import pytest

from src.shared.auth import UnauthorizedError, get_authenticated_identity


def test_identity_comes_from_rest_cognito_claims() -> None:
    identity = get_authenticated_identity({
        'requestContext': {'authorizer': {'claims': {'sub': 'cognito-user', 'email': 'user@example.com'}}},
    })
    assert identity.user_id == 'cognito-user'
    assert identity.email == 'user@example.com'


def test_identity_supports_http_api_jwt_claim_shape() -> None:
    identity = get_authenticated_identity({
        'requestContext': {'authorizer': {'jwt': {'claims': {'sub': 'http-user'}}}},
    })
    assert identity.user_id == 'http-user'


@pytest.mark.parametrize('event', [{}, {'requestContext': {}}, {'requestContext': {'authorizer': {'claims': {}}}}])
def test_missing_identity_is_unauthorized(event: dict) -> None:
    with pytest.raises(UnauthorizedError):
        get_authenticated_identity(event)


def test_untrusted_body_is_not_used_by_identity_helper() -> None:
    with pytest.raises(UnauthorizedError):
        get_authenticated_identity({'ownerId': 'spoofed-user'})
