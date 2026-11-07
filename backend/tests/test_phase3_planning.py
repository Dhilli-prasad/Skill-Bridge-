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


def response_body(response: dict) -> dict:
    return json.loads(response['body'])


def create_project() -> str:
    payload = {
        'title': 'Planning project', 'description': 'A project.', 'fullDescription': 'A project for planning.',
        'goals': ['Ship'], 'outcomes': ['Demo'], 'technology': ['Python'], 'category': 'Tools',
        'difficulty': 'Beginner', 'requiredRoles': ['Developer'], 'capacity': 4,
    }
    response = app.handler(event('POST', '/api/projects', body=payload), None)
    assert response['statusCode'] == 201
    return response_body(response)['data']['id']


def create_milestone(project_id: str, **overrides: object) -> str:
    payload = {'title': 'First milestone', 'description': 'Build the first slice.', 'order': 1}
    payload.update(overrides)
    response = app.handler(event('POST', f'/api/projects/{project_id}/milestones', body=payload), None)
    assert response['statusCode'] == 201
    return response_body(response)['data']['milestoneId']


def test_milestone_crud_and_zero_task_progress(table: FakeTable) -> None:
    project_id = create_project()
    milestone_id = create_milestone(project_id)
    listed = app.handler(event('GET', f'/api/projects/{project_id}/milestones'), None)
    updated = app.handler(event('PATCH', f'/api/projects/{project_id}/milestones/{milestone_id}', body={'status': 'IN_PROGRESS'}), None)
    deleted = app.handler(event('DELETE', f'/api/projects/{project_id}/milestones/{milestone_id}'), None)
    assert listed['statusCode'] == 200
    assert response_body(listed)['data'][0]['progress']['percentage'] == 0
    assert updated['statusCode'] == 200
    assert response_body(updated)['data']['status'] == 'IN_PROGRESS'
    assert deleted['statusCode'] == 204


def test_task_crud_progress_status_transitions_and_activity(table: FakeTable) -> None:
    project_id = create_project()
    milestone_id = create_milestone(project_id)
    created = app.handler(event('POST', f'/api/projects/{project_id}/tasks', body={
        'title': 'Implement API', 'milestoneId': milestone_id, 'assigneeId': 'owner', 'priority': 'HIGH',
    }), None)
    task_id = response_body(created)['data']['taskId']
    started = app.handler(event('PATCH', f'/api/projects/{project_id}/tasks/{task_id}', body={'status': 'IN_PROGRESS'}), None)
    reviewed = app.handler(event('PATCH', f'/api/projects/{project_id}/tasks/{task_id}', body={'status': 'IN_REVIEW'}), None)
    completed = app.handler(event('PATCH', f'/api/projects/{project_id}/tasks/{task_id}', body={'status': 'COMPLETED'}), None)
    tasks = app.handler(event('GET', f'/api/projects/{project_id}/tasks', query={'limit': '1'}), None)
    detail = app.handler(event('GET', f'/api/projects/{project_id}/tasks/{task_id}'), None)
    assert created['statusCode'] == 201
    assert started['statusCode'] == reviewed['statusCode'] == completed['statusCode'] == 200
    assert response_body(tasks)['progress']['percentage'] == 100
    assert response_body(detail)['data']['milestoneProgress']['completedTasks'] == 1
    assert sum(1 for item in table.items.values() if item.get('entityType') == 'activity') >= 5


def test_task_permissions_and_references(table: FakeTable) -> None:
    project_id = create_project()
    missing_milestone = app.handler(event('POST', f'/api/projects/{project_id}/tasks', body={'title': 'Bad', 'milestoneId': 'missing'}), None)
    missing_member = app.handler(event('POST', f'/api/projects/{project_id}/tasks', body={'title': 'Bad', 'assigneeId': 'not-a-member'}), None)
    milestone_id = create_milestone(project_id)
    task = app.handler(event('POST', f'/api/projects/{project_id}/tasks', body={'title': 'Private task', 'milestoneId': milestone_id}), None)
    task_id = response_body(task)['data']['taskId']
    unauthorized = app.handler(event('PATCH', f'/api/projects/{project_id}/tasks/{task_id}', user_id='other', body={'status': 'IN_PROGRESS'}), None)
    invalid_transition = app.handler(event('PATCH', f'/api/projects/{project_id}/tasks/{task_id}', body={'status': 'COMPLETED'}), None)
    delete_milestone = app.handler(event('DELETE', f'/api/projects/{project_id}/milestones/{milestone_id}'), None)
    assert missing_milestone['statusCode'] == 400
    assert missing_member['statusCode'] == 400
    assert unauthorized['statusCode'] == 403
    assert invalid_transition['statusCode'] == 400
    assert delete_milestone['statusCode'] == 409


def test_private_tasks_require_membership(table: FakeTable) -> None:
    project_id = create_project()
    metadata = table.items[(f'PROJECT#{project_id}', 'METADATA')]
    metadata['visibility'] = 'private'
    denied = app.handler(event('GET', f'/api/projects/{project_id}/tasks', user_id='other'), None)
    owner = app.handler(event('GET', f'/api/projects/{project_id}/tasks'), None)
    assert denied['statusCode'] == 403
    assert owner['statusCode'] == 200
