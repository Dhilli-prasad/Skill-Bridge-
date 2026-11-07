import json

import pytest

from src.functions.api import app
from src.projects.repository import ProjectRepository
from src.projects.service import ProjectService
from tests.fakes import FakeTable


def event(method: str, path: str, *, body: dict | None = None, user_id: str | None = 'owner') -> dict:
    request: dict = {'httpMethod': method, 'path': path, 'queryStringParameters': {}}
    if user_id is not None:
        request['requestContext'] = {'authorizer': {'claims': {'sub': user_id}}}
    if body is not None:
        request['body'] = json.dumps(body)
    return request


def project_payload(**overrides: object) -> dict:
    value = {
        'title': 'Collaboration project', 'description': 'A project.', 'fullDescription': 'A project for testing.',
        'goals': ['Ship'], 'outcomes': ['Demo'], 'technology': ['Python'], 'category': 'Tools',
        'difficulty': 'Beginner', 'requiredRoles': ['Developer'], 'capacity': 3,
    }
    value.update(overrides)
    return value


@pytest.fixture
def table(monkeypatch: pytest.MonkeyPatch) -> FakeTable:
    fake = FakeTable()
    repository = ProjectRepository(table=fake)
    monkeypatch.setattr(app, 'project_repository', repository)
    monkeypatch.setattr(app, 'project_service', ProjectService(repository))
    return fake


def body(response: dict) -> dict:
    return json.loads(response['body'])


def create_project() -> str:
    response = app.handler(event('POST', '/api/projects', body=project_payload()), None)
    assert response['statusCode'] == 201
    return body(response)['data']['id']


def test_join_request_approval_creates_member_and_is_owner_only(table: FakeTable) -> None:
    project_id = create_project()
    created = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id='member', body={'role': 'Developer'}), None)
    request_id = body(created)['data']['id']
    forbidden = app.handler(event('PATCH', f'/api/projects/{project_id}/join-requests/{request_id}', user_id='member', body={'action': 'approve'}), None)
    approved = app.handler(event('PATCH', f'/api/projects/{project_id}/join-requests/{request_id}', body={'action': 'approve'}), None)
    members = app.handler(event('GET', f'/api/projects/{project_id}/members'), None)
    assert created['statusCode'] == 201
    assert forbidden['statusCode'] == 403
    assert approved['statusCode'] == 200
    assert body(approved)['data']['status'] == 'approved'
    assert body(members)['data'][1]['userId'] == 'member'


def test_duplicate_pending_join_request_is_rejected(table: FakeTable) -> None:
    project_id = create_project()
    first = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id='member', body={}), None)
    second = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id='member', body={}), None)
    assert first['statusCode'] == 201
    assert second['statusCode'] == 409


def test_invitation_acceptance_is_invitee_only_and_idempotently_protected(table: FakeTable) -> None:
    project_id = create_project()
    sent = app.handler(event('POST', f'/api/projects/{project_id}/invitations', body={'inviteeId': 'invitee', 'role': 'Tester'}), None)
    invitation_id = body(sent)['data']['id']
    wrong_user = app.handler(event('PATCH', f'/api/projects/{project_id}/invitations/{invitation_id}', user_id='other', body={'action': 'accept'}), None)
    accepted = app.handler(event('PATCH', f'/api/projects/{project_id}/invitations/{invitation_id}', user_id='invitee', body={'action': 'accept'}), None)
    repeated = app.handler(event('PATCH', f'/api/projects/{project_id}/invitations/{invitation_id}', user_id='invitee', body={'action': 'accept'}), None)
    assert sent['statusCode'] == 201
    assert wrong_user['statusCode'] == 403
    assert accepted['statusCode'] == 200
    assert repeated['statusCode'] == 409


def test_owner_cannot_join_and_authentication_is_required(table: FakeTable) -> None:
    project_id = create_project()
    owner_request = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', body={}), None)
    anonymous = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id=None, body={}), None)
    assert owner_request['statusCode'] == 403
    assert anonymous['statusCode'] == 401


def test_capacity_is_enforced_by_transaction(table: FakeTable) -> None:
    project_id = create_project()
    first = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id='one', body={}), None)
    first_id = body(first)['data']['id']
    assert app.handler(event('PATCH', f'/api/projects/{project_id}/join-requests/{first_id}', body={'action': 'approve'}), None)['statusCode'] == 200
    second = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id='two', body={}), None)
    second_id = body(second)['data']['id']
    assert app.handler(event('PATCH', f'/api/projects/{project_id}/join-requests/{second_id}', body={'action': 'approve'}), None)['statusCode'] == 200
    full = app.handler(event('POST', f'/api/projects/{project_id}/join-requests', user_id='three', body={}), None)
    assert full['statusCode'] == 409
