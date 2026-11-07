import json

import pytest

from src.functions.api import app
from src.projects.repository import ProjectRepository
from src.projects.service import ProjectService
from tests.fakes import FakeTable


def event(method: str, path: str, *, body: dict | None = None, user_id: str | None = 'owner', query: dict | None = None) -> dict:
    request: dict = {'httpMethod': method, 'path': path, 'queryStringParameters': query or {}}
    if user_id is not None:
        request['requestContext'] = {'authorizer': {'claims': {'sub': user_id}}}
    if body is not None:
        request['body'] = json.dumps(body)
    return request


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
    payload = {
        'title': 'Completion project', 'description': 'A project.', 'fullDescription': 'A project for completion.',
        'goals': ['Ship'], 'outcomes': ['Demo'], 'technology': ['Python'], 'category': 'Tools',
        'difficulty': 'Beginner', 'requiredRoles': ['Developer'], 'capacity': 4,
    }
    response = app.handler(event('POST', '/api/projects', body=payload), None)
    assert response['statusCode'] == 201
    return body(response)['data']['id']


def prepare_complete_project(table: FakeTable) -> tuple[str, str, str]:
    project_id = create_project()
    table.items[(f'PROJECT#{project_id}', 'MEMBER#member')] = {
        'PK': f'PROJECT#{project_id}', 'SK': 'MEMBER#member', 'entityType': 'membership',
        'projectId': project_id, 'userId': 'member', 'role': 'Developer', 'joinedAt': 'now',
    }
    table.items[(f'PROJECT#{project_id}', 'METADATA')]['memberCount'] = 2
    milestone_response = app.handler(event('POST', f'/api/projects/{project_id}/milestones', body={'title': 'Release'}), None)
    milestone_id = body(milestone_response)['data']['milestoneId']
    task_response = app.handler(event('POST', f'/api/projects/{project_id}/tasks', body={
        'title': 'Ship release', 'milestoneId': milestone_id, 'assigneeId': 'member',
    }), None)
    task_id = body(task_response)['data']['taskId']
    for status in ('IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'):
        assert app.handler(event('PATCH', f'/api/projects/{project_id}/tasks/{task_id}', body={'status': status}), None)['statusCode'] == 200
    assert app.handler(event('PATCH', f'/api/projects/{project_id}/milestones/{milestone_id}', body={'status': 'COMPLETED'}), None)['statusCode'] == 200
    return project_id, milestone_id, task_id


def test_progress_activity_and_contribution_summary(table: FakeTable) -> None:
    project_id = create_project()
    milestone = body(app.handler(event('POST', f'/api/projects/{project_id}/milestones', body={'title': 'Plan'}), None))['data']['milestoneId']
    task = body(app.handler(event('POST', f'/api/projects/{project_id}/tasks', body={'title': 'Task', 'milestoneId': milestone, 'dueDate': '2000-01-01'}), None))['data']['taskId']
    progress = app.handler(event('GET', f'/api/projects/{project_id}/progress'), None)
    activity = app.handler(event('GET', f'/api/projects/{project_id}/activity', query={'limit': '2'}), None)
    contributions = app.handler(event('GET', f'/api/projects/{project_id}/members/owner/contributions'), None)
    assert progress['statusCode'] == 200
    assert body(progress)['data']['todoTasks'] == 1
    assert body(progress)['data']['overdueTasks'] == 1
    assert activity['statusCode'] == 200
    assert body(activity)['pagination']['nextCursor'] is not None
    assert contributions['statusCode'] == 200
    assert body(contributions)['data']['assignedTasks'] == 0
    assert task


def test_completion_requires_complete_work_and_owner(table: FakeTable) -> None:
    project_id = create_project()
    denied = app.handler(event('POST', f'/api/projects/{project_id}/completion', user_id='member'), None)
    incomplete = app.handler(event('POST', f'/api/projects/{project_id}/completion'), None)
    assert denied['statusCode'] == 403
    assert incomplete['statusCode'] == 201


def test_completion_confirmation_and_immutable_contribution(table: FakeTable) -> None:
    project_id, _, _ = prepare_complete_project(table)
    submitted = app.handler(event('POST', f'/api/projects/{project_id}/completion'), None)
    duplicate = app.handler(event('POST', f'/api/projects/{project_id}/completion'), None)
    unauthorized = app.handler(event('POST', f'/api/projects/{project_id}/completion/confirm', user_id='stranger'), None)
    confirmed = app.handler(event('POST', f'/api/projects/{project_id}/completion/confirm', user_id='member'), None)
    repeated = app.handler(event('POST', f'/api/projects/{project_id}/completion/confirm', user_id='member'), None)
    completion = app.handler(event('GET', f'/api/projects/{project_id}/completion'), None)
    contribution = app.handler(event('GET', f'/api/projects/{project_id}/members/member/contributions'), None)
    assert submitted['statusCode'] == 201
    assert body(submitted)['data']['status'] == 'PENDING_CONFIRMATION'
    assert duplicate['statusCode'] == 409
    assert unauthorized['statusCode'] == 403
    assert confirmed['statusCode'] == 200
    assert body(confirmed)['data']['status'] == 'COMPLETED'
    assert repeated['statusCode'] == 409
    assert body(completion)['data']['status'] == 'COMPLETED'
    assert body(contribution)['data']['verifiedContribution'] is True
    assert table.items[(f'PROJECT#{project_id}', 'METADATA')]['status'] == 'COMPLETED'


def test_completion_rejection_requires_reason(table: FakeTable) -> None:
    project_id, _, _ = prepare_complete_project(table)
    assert app.handler(event('POST', f'/api/projects/{project_id}/completion'), None)['statusCode'] == 201
    missing_reason = app.handler(event('POST', f'/api/projects/{project_id}/completion/reject', user_id='member', body={}), None)
    rejected = app.handler(event('POST', f'/api/projects/{project_id}/completion/reject', user_id='member', body={'reason': 'Needs review'}), None)
    assert missing_reason['statusCode'] == 400
    assert rejected['statusCode'] == 200
    assert body(rejected)['data']['status'] == 'REJECTED'
