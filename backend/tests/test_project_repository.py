import pytest

from src.projects.repository import ConflictError, InvalidCursorError, ProjectRepository
from tests.fakes import FakeConditionalError, FakeTable


def project_item(project_id: str) -> dict:
    return {
        'PK': f'PROJECT#{project_id}',
        'SK': 'METADATA',
        'GSI1PK': ProjectRepository.PROJECT_INDEX_PARTITION,
        'GSI1SK': f'2026-01-01T00:00:00+00:00#{project_id}',
        'id': project_id,
        'title': project_id,
        'ownerId': 'owner-1',
        'visibility': 'public',
    }


def test_create_and_retrieve_project() -> None:
    table = FakeTable()
    repository = ProjectRepository(table=table)
    item = project_item('one')
    assert repository.create_project(item)['id'] == 'one'
    assert repository.get_project('one')['title'] == 'one'


def test_duplicate_project_is_a_conflict() -> None:
    repository = ProjectRepository(table=FakeTable())
    item = project_item('duplicate')
    repository.create_project(item)
    with pytest.raises(ConflictError):
        repository.create_project(item)


def test_public_listing_uses_cursor_pagination() -> None:
    repository = ProjectRepository(table=FakeTable())
    for project_id in ('one', 'two', 'three'):
        repository.create_project(project_item(project_id))
    first, cursor = repository.list_public_projects(2)
    second, next_cursor = repository.list_public_projects(2, cursor)
    assert [item['id'] for item in first] == ['one', 'three']
    assert [item['id'] for item in second] == ['two']
    assert cursor is not None
    assert next_cursor is None


def test_malformed_cursor_is_rejected() -> None:
    with pytest.raises(InvalidCursorError):
        ProjectRepository(table=FakeTable()).list_public_projects(10, 'not-a-cursor')


def test_dynamodb_errors_are_wrapped() -> None:
    table = FakeTable()
    table.failure = RuntimeError('network detail must not escape')
    repository = ProjectRepository(table=table)
    with pytest.raises(Exception) as error:
        repository.get_project('missing')
    assert 'network detail' not in str(error.value)


def test_conditional_error_shape_is_detected() -> None:
    table = FakeTable()
    table.failure = FakeConditionalError('ConditionalCheckFailedException')
    with pytest.raises(ConflictError):
        ProjectRepository(table=table).create_project(project_item('conflict'))
