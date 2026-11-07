import json

from src.functions.api.app import handler


def test_http_api_v2_public_health_event_is_supported() -> None:
    response = handler({
        'rawPath': '/health',
        'requestContext': {'http': {'method': 'GET'}},
    }, None)
    assert response['statusCode'] == 200
    assert json.loads(response['body'])['status'] == 'ok'
