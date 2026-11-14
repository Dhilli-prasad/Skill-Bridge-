import json

from src.functions.api.app import handler


def test_health_is_public_foundation_endpoint() -> None:
    response = handler({"httpMethod": "GET", "path": "/health"}, None)
    assert response["statusCode"] == 200
    assert json.loads(response["body"])["status"] == "ok"


def test_unknown_authenticated_module_route_is_not_found() -> None:
    response = handler({
        "httpMethod": "GET",
        "path": "/api/community",
        "requestContext": {"authorizer": {"claims": {"sub": "user-1"}}},
    }, None)
    assert response["statusCode"] == 404


def test_profile_api_requires_verified_identity_and_rejects_client_user_ids() -> None:
    unauthenticated = handler({"httpMethod": "GET", "path": "/api/profiles/me"}, None)
    assert unauthenticated["statusCode"] == 401
    response = handler({
        "httpMethod": "PUT", "path": "/api/profiles/me",
        "requestContext": {"authorizer": {"jwt": {"claims": {"sub": "verified-sub"}}}},
        "body": json.dumps({"fullName": "Other user", "userId": "untrusted-sub"}),
    }, None)
    assert response["statusCode"] == 400
    assert json.loads(response["body"])["error"]["code"] == "invalid_request"
