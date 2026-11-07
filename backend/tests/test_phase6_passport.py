import json

import pytest

from src.functions.api import app
from src.projects.repository import ProjectRepository
from src.projects.service import ProjectService
from tests.fakes import FakeTable


def event(method: str, path: str, *, user_id: str = 'viewer', query: dict | None = None) -> dict:
    return {'httpMethod': method, 'path': path, 'queryStringParameters': query or {}, 'requestContext': {'authorizer': {'claims': {'sub': user_id}}}}


@pytest.fixture
def table(monkeypatch: pytest.MonkeyPatch) -> FakeTable:
    fake = FakeTable()
    repository = ProjectRepository(table=fake)
    monkeypatch.setattr(app, 'project_repository', repository)
    monkeypatch.setattr(app, 'project_service', ProjectService(repository))
    return fake


def body(response: dict) -> dict:
    return json.loads(response['body'])


def add_project(table: FakeTable, project_id: str, owner_id: str, visibility: str = 'public') -> None:
    table.items[(f'PROJECT#{project_id}', 'METADATA')] = {
        'PK': f'PROJECT#{project_id}', 'SK': 'METADATA', 'id': project_id, 'title': f'Project {project_id}',
        'description': 'Public project description.', 'ownerId': owner_id, 'visibility': visibility,
        'status': 'COMPLETED', 'createdAt': '2026-01-01T00:00:00+00:00', 'updatedAt': '2026-01-01T00:00:00+00:00',
    }
    table.items[(f'PROJECT#{project_id}', 'CONTRIBUTION#viewer')] = {
        'PK': f'PROJECT#{project_id}', 'SK': 'CONTRIBUTION#viewer', 'entityType': 'contribution',
        'contributionId': f'contribution-{project_id}-viewer', 'projectId': project_id, 'userId': 'viewer',
        'verifiedCompletion': True, 'completedTaskIds': [f'task-{project_id}'], 'completedTaskCount': 1,
        'completionTimestamp': '2026-01-02T00:00:00+00:00', 'GSI1PK': 'USER#viewer#CONTRIBUTIONS',
        'GSI1SK': f'2026-01-02T00:00:00+00:00#{project_id}#viewer',
    }


def test_self_contributions_and_completed_projects_are_paginated(table: FakeTable) -> None:
    add_project(table, 'one', 'owner')
    add_project(table, 'two', 'owner')
    contributions = app.handler(event('GET', '/api/users/me/contributions', query={'limit': '1'}), None)
    next_cursor = body(contributions)['pagination']['nextCursor']
    second = app.handler(event('GET', '/api/users/me/contributions', query={'limit': '1', 'nextCursor': next_cursor}), None)
    completed = app.handler(event('GET', '/api/users/me/completed-projects'), None)
    assert contributions['statusCode'] == 200
    assert len(body(contributions)['data']) == 1
    assert second['statusCode'] == 200
    assert len(body(completed)['data']) == 2
    assert 'completedTaskIds' in body(contributions)['data'][0]


def test_public_user_view_filters_private_projects_and_private_task_ids(table: FakeTable) -> None:
    add_project(table, 'public', 'owner', 'public')
    add_project(table, 'private', 'owner', 'private')
    response = app.handler(event('GET', '/api/users/viewed/contributions', user_id='viewer'), None)
    assert response['statusCode'] == 200
    assert body(response)['data'] == []
    owner_view = app.handler(event('GET', '/api/users/viewer/contributions', user_id='viewer'), None)
    assert owner_view['statusCode'] == 200
    assert all('completedTaskIds' in item for item in body(owner_view)['data'])


def test_other_user_public_contributions_are_visible_without_private_fields(table: FakeTable) -> None:
    add_project(table, 'public', 'owner', 'public')
    response = app.handler(event('GET', '/api/users/viewer/contributions', user_id='other'), None)
    assert response['statusCode'] == 200
    assert len(body(response)['data']) == 1
    assert 'completedTaskIds' not in body(response)['data'][0]
