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
