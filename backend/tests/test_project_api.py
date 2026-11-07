import json
from types import SimpleNamespace

import pytest

from src.functions.api import app
from src.projects.repository import ProjectRepository
from src.projects.service import ProjectService
from tests.fakes import FakeTable


def event(method: str, path: str, *, body: dict | list | None = None, user_id: str | None = 'trusted-user', query: dict | None = None) -> dict:
    request: dict = {
        'httpMethod': method,
        'path': path,
        'queryStringParameters': query or {},
    }
    if user_id is not None:
        request['requestContext'] = {'authorizer': {'claims': {'sub': user_id}}}
    if body is not None:
        request['body'] = json.dumps(body)
    return request


def payload(**overrides: object) -> dict:
    value = {
        'title': 'Ship a small project',
        'description': 'A focused collaboration project.',
        'fullDescription': 'Build and document a small project together.',
        'goals': ['Ship a useful prototype'],
        'outcomes': ['A working demo'],
        'technology': ['React', 'Python'],
        'category': 'Web Development',
        'difficulty': 'Beginner',
        'requiredRoles': ['Developer'],
        'capacity': 4,
    }
    value.update(overrides)
    return value


@pytest.fixture
def fake_table(monkeypatch: pytest.MonkeyPatch) -> FakeTable:
    table = FakeTable()
    repository = ProjectRepository(table=table)
    monkeypatch.setattr(app, 'project_repository', repository)
    monkeypatch.setattr(app, 'project_service', ProjectService(repository))
    return table


def response_body(response: dict) -> dict:
    return json.loads(response['body'])


def test_create_project_uses_authenticated_owner(fake_table: FakeTable) -> None:
    response = app.handler(event('POST', '/api/projects', body=payload()), None)
    assert response['statusCode'] == 201
    body = response_body(response)
    assert body['data']['id'].startswith('project-')
    assert 'ownerId' not in body['data']
    stored = next(iter(fake_table.items.values()))
    assert stored['ownerId'] == 'trusted-user'
    assert stored['createdAt'] == stored['updatedAt']


def test_owner_spoofing_is_rejected(fake_table: FakeTable) -> None:
    response = app.handler(event('POST', '/api/projects', body=payload(ownerId='attacker')), None)
    assert response['statusCode'] == 400
    assert fake_table.items == {}


def test_missing_authentication_is_unauthorized(fake_table: FakeTable) -> None:
    response = app.handler(event('GET', '/api/projects', user_id=None), None)
    assert response['statusCode'] == 401
    assert response_body(response)['error']['code'] == 'unauthorized'


def test_malformed_payload_is_rejected(fake_table: FakeTable) -> None:
    response = app.handler(event('POST', '/api/projects', body=[]), None)
    assert response['statusCode'] == 400
    assert response_body(response)['error']['code'] == 'invalid_request'


def test_project_retrieval_and_not_found(fake_table: FakeTable) -> None:
    created = app.handler(event('POST', '/api/projects', body=payload()), None)
    project_id = response_body(created)['data']['id']
    found = app.handler(event('GET', f'/api/projects/{project_id}'), None)
    missing = app.handler(event('GET', '/api/projects/missing'), None)
    assert found['statusCode'] == 200
    assert response_body(found)['data']['fullDescription'] == payload()['fullDescription']
    assert missing['statusCode'] == 404


def test_listing_and_pagination(fake_table: FakeTable) -> None:
    repository = ProjectRepository(table=fake_table)
    for project_id in ('one', 'two', 'three'):
        item = {
            'PK': f'PROJECT#{project_id}', 'SK': 'METADATA',
            'GSI1PK': ProjectRepository.PROJECT_INDEX_PARTITION,
            'GSI1SK': f'2026-01-01T00:00:00+00:00#{project_id}',
            'id': project_id, 'title': project_id, 'description': 'public',
            'technology': ['Python'], 'category': 'Tools', 'difficulty': 'Beginner',
            'requiredRoles': ['Developer'], 'capacity': 3, 'memberCount': 1,
            'status': 'Recruiting', 'visibility': 'public',
            'createdAt': '2026-01-01T00:00:00+00:00', 'updatedAt': '2026-01-01T00:00:00+00:00',
        }
        repository.create_project(item)
    first = app.handler(event('GET', '/api/projects', query={'limit': '2'}), None)
    first_body = response_body(first)
    second = app.handler(event('GET', '/api/projects', query={'limit': '2', 'nextCursor': first_body['pagination']['nextCursor']}), None)
    assert first['statusCode'] == 200
    assert len(first_body['data']) == 2
    assert second['statusCode'] == 200
    assert len(response_body(second)['data']) == 1


def test_private_project_owner_and_approved_member_can_view(fake_table: FakeTable) -> None:
    fake_table.items[('PROJECT#private', 'METADATA')] = {
        'PK': 'PROJECT#private', 'SK': 'METADATA', 'id': 'private', 'title': 'Private',
        'description': 'private', 'fullDescription': 'private', 'ownerId': 'owner-1',
        'visibility': 'private', 'technology': ['Python'], 'category': 'Tools',
        'difficulty': 'Beginner', 'requiredRoles': ['Developer'], 'capacity': 2,
        'memberCount': 1, 'status': 'Recruiting', 'createdAt': 'now', 'updatedAt': 'now',
    }
    fake_table.items[('PROJECT#private', 'MEMBER#member-1')] = {
        'PK': 'PROJECT#private', 'SK': 'MEMBER#member-1', 'entityType': 'membership',
        'projectId': 'private', 'userId': 'member-1', 'role': 'Developer', 'joinedAt': 'now',
    }
    owner = app.handler(event('GET', '/api/projects/private', user_id='owner-1'), None)
    member = app.handler(event('GET', '/api/projects/private', user_id='member-1'), None)
    assert owner['statusCode'] == 200
    assert member['statusCode'] == 200


def test_private_project_denies_non_member_and_pending_requester(fake_table: FakeTable) -> None:
    fake_table.items[('PROJECT#private', 'METADATA')] = {
        'PK': 'PROJECT#private', 'SK': 'METADATA', 'id': 'private', 'title': 'Private',
        'description': 'private', 'fullDescription': 'private', 'ownerId': 'owner-1',
        'visibility': 'private', 'technology': ['Python'], 'category': 'Tools',
        'difficulty': 'Beginner', 'requiredRoles': ['Developer'], 'capacity': 2,
        'memberCount': 1, 'status': 'Recruiting', 'createdAt': 'now', 'updatedAt': 'now',
    }
    fake_table.items[('PROJECT#private', 'JOIN_REQUEST#pending')] = {
        'PK': 'PROJECT#private', 'SK': 'JOIN_REQUEST#pending', 'entityType': 'join_request',
        'id': 'pending', 'projectId': 'private', 'requesterId': 'pending-user',
        'role': 'Developer', 'status': 'pending', 'createdAt': 'now', 'updatedAt': 'now',
    }
    fake_table.items[('PROJECT#private', 'JOIN_PENDING#pending-user')] = {
        'PK': 'PROJECT#private', 'SK': 'JOIN_PENDING#pending-user', 'entityType': 'join_pending',
        'requestId': 'pending',
    }
    forbidden = app.handler(event('GET', '/api/projects/private', user_id='other-user'), None)
    pending = app.handler(event('GET', '/api/projects/private', user_id='pending-user'), None)
    assert forbidden['statusCode'] == 403
    assert pending['statusCode'] == 403


def test_public_project_is_available_to_any_authenticated_user(fake_table: FakeTable) -> None:
    fake_table.items[('PROJECT#public', 'METADATA')] = {
        'PK': 'PROJECT#public', 'SK': 'METADATA', 'id': 'public', 'title': 'Public',
        'description': 'public', 'fullDescription': 'public', 'ownerId': 'owner-1',
        'visibility': 'public', 'technology': ['Python'], 'category': 'Tools',
        'difficulty': 'Beginner', 'requiredRoles': ['Developer'], 'capacity': 2,
        'memberCount': 1, 'status': 'Recruiting', 'createdAt': 'now', 'updatedAt': 'now',
    }
    response = app.handler(event('GET', '/api/projects/public', user_id='other-user'), None)
    assert response['statusCode'] == 200


def test_project_access_rejects_missing_or_invalid_identity_claims(fake_table: FakeTable) -> None:
    fake_table.items[('PROJECT#public', 'METADATA')] = {
        'PK': 'PROJECT#public', 'SK': 'METADATA', 'id': 'public', 'title': 'Public',
        'description': 'public', 'visibility': 'public', 'ownerId': 'owner-1',
    }
    missing = app.handler({'httpMethod': 'GET', 'path': '/api/projects/public'}, None)
    invalid = app.handler({
        'httpMethod': 'GET', 'path': '/api/projects/public',
        'requestContext': {'authorizer': {'claims': {'sub': ''}}},
    }, None)
    assert missing['statusCode'] == 401
    assert invalid['statusCode'] == 401


def test_duplicate_generated_id_returns_conflict(fake_table: FakeTable, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr('src.projects.service.uuid4', lambda: SimpleNamespace(hex='same-id'))
    first = app.handler(event('POST', '/api/projects', body=payload()), None)
    second = app.handler(event('POST', '/api/projects', body=payload()), None)
    assert first['statusCode'] == 201
    assert second['statusCode'] == 409


def test_dynamodb_failure_returns_safe_error(fake_table: FakeTable) -> None:
    fake_table.failure = RuntimeError('sensitive infrastructure detail')
    response = app.handler(event('GET', '/api/projects'), None)
    assert response['statusCode'] == 500
    assert 'sensitive infrastructure detail' not in response['body']
