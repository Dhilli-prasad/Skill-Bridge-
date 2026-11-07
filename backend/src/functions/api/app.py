import base64
import binascii
import json
import logging
from collections.abc import Mapping
from typing import Any

from src.projects.repository import ConflictError, InvalidCursorError, ProjectRepository, RepositoryError
from src.projects.service import ForbiddenError, NotFoundError, ProjectService
from src.shared.auth import UnauthorizedError, get_authenticated_identity
from src.shared.validation import ValidationError

from src.shared.config import load_settings

logger = logging.getLogger(__name__)
project_repository = ProjectRepository()
project_service = ProjectService(project_repository)


def _response(status_code: int, body: Mapping[str, Any]) -> dict[str, Any]:
    settings = load_settings()
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": settings.allowed_origin,
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        },
        "body": json.dumps(body),
    }


def _error_response(status_code: int, code: str, message: str) -> dict[str, Any]:
    return _response(status_code, {'error': {'code': code, 'message': message}})


def _request_method(event: Mapping[str, Any]) -> str:
    method = event.get('httpMethod')
    if isinstance(method, str) and method:
        return method.upper()
    context = event.get('requestContext')
    if isinstance(context, Mapping):
        http = context.get('http')
        if isinstance(http, Mapping) and isinstance(http.get('method'), str):
            return http['method'].upper()
    return ''


def _request_path(event: Mapping[str, Any]) -> str:
    path = event.get('path') or event.get('rawPath') or ''
    return path if isinstance(path, str) else ''


def _route_segments(path: str) -> list[str]:
    segments = [segment for segment in path.split('/') if segment]
    if segments and segments[0] == 'api':
        segments = segments[1:]
    return segments


def _request_body(event: Mapping[str, Any]) -> Any:
    body = event.get('body')
    if body in (None, ''):
        return None
    if not isinstance(body, str):
        raise ValidationError('Request body must be valid JSON.')
    if event.get('isBase64Encoded') is True:
        try:
            body = base64.b64decode(body, validate=True).decode('utf-8')
        except (binascii.Error, UnicodeDecodeError) as error:
            raise ValidationError('Request body must be valid JSON.') from error
    try:
        return json.loads(body)
    except json.JSONDecodeError as error:
        raise ValidationError('Request body must be valid JSON.') from error


def _query_parameters(event: Mapping[str, Any]) -> Mapping[str, Any]:
    query = event.get('queryStringParameters')
    return query if isinstance(query, Mapping) else {}


def _pagination(query: Mapping[str, Any]) -> tuple[int, str | None]:
    raw_limit = query.get('limit', '20')
    try:
        return int(raw_limit), query.get('nextCursor')
    except (TypeError, ValueError) as error:
        raise ValidationError('limit must be an integer.') from error


def handler(event: Mapping[str, Any], context: Any) -> dict[str, Any]:
    """Dispatch the foundation API without trusting frontend roles or executing user code."""
    del context
    method = _request_method(event)
    path = _request_path(event)

    if method == "OPTIONS":
        return _response(204, {})
    if method == "GET" and path == "/health":
        settings = load_settings()
        return _response(200, {"service": "skillbridge-api", "environment": settings.environment, "status": "ok"})

    try:
        identity = get_authenticated_identity(event)
        segments = _route_segments(path)
        if method == 'GET' and segments == ['projects']:
            query = _query_parameters(event)
            limit, cursor = _pagination(query)
            projects, next_cursor = project_service.list_projects(identity, limit, cursor)
            return _response(200, {'data': projects, 'pagination': {'nextCursor': next_cursor, 'limit': limit}})
        if method == 'GET' and len(segments) == 2 and segments[0] == 'projects':
            project = project_service.get_project(identity, segments[1])
            return _response(200, {'data': project})
        if method == 'POST' and segments == ['projects']:
            project = project_service.create_project(identity, _request_body(event))
            return _response(201, {'data': project})
        if method == 'POST' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'join-requests':
            request = project_service.create_join_request(identity, segments[1], _request_body(event))
            return _response(201, {'data': request})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'join-requests':
            requests = project_service.list_join_requests(identity, segments[1])
            return _response(200, {'data': requests})
        if method == 'PATCH' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'join-requests':
            request = project_service.review_join_request(identity, segments[1], segments[3], _request_body(event))
            return _response(200, {'data': request})
        if method == 'POST' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'invitations':
            invitation = project_service.create_invitation(identity, segments[1], _request_body(event))
            return _response(201, {'data': invitation})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'invitations':
            invitations = project_service.list_invitations(identity, segments[1])
            return _response(200, {'data': invitations})
        if method == 'PATCH' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'invitations':
            invitation = project_service.respond_invitation(identity, segments[1], segments[3], _request_body(event))
            return _response(200, {'data': invitation})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'members':
            members = project_service.list_members(identity, segments[1])
            return _response(200, {'data': members})
        if method == 'POST' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'milestones':
            milestone = project_service.create_milestone(identity, segments[1], _request_body(event))
            return _response(201, {'data': milestone})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'milestones':
            limit, cursor = _pagination(_query_parameters(event))
            milestones, next_cursor = project_service.list_milestones(identity, segments[1], limit, cursor)
            return _response(200, {'data': milestones, 'pagination': {'nextCursor': next_cursor, 'limit': limit}})
        if method == 'PATCH' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'milestones':
            milestone = project_service.update_milestone(identity, segments[1], segments[3], _request_body(event))
            return _response(200, {'data': milestone})
        if method == 'DELETE' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'milestones':
            project_service.delete_milestone(identity, segments[1], segments[3])
            return _response(204, {})
        if method == 'POST' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'tasks':
            task = project_service.create_task(identity, segments[1], _request_body(event))
            return _response(201, {'data': task})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'tasks':
            limit, cursor = _pagination(_query_parameters(event))
            tasks, progress, next_cursor = project_service.list_tasks(identity, segments[1], limit, cursor)
            return _response(200, {'data': tasks, 'progress': progress, 'pagination': {'nextCursor': next_cursor, 'limit': limit}})
        if method == 'GET' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'tasks':
            task = project_service.get_task(identity, segments[1], segments[3])
            return _response(200, {'data': task})
        if method == 'PATCH' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'tasks':
            task = project_service.update_task(identity, segments[1], segments[3], _request_body(event))
            return _response(200, {'data': task})
        if method == 'DELETE' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'tasks':
            project_service.delete_task(identity, segments[1], segments[3])
            return _response(204, {})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'progress':
            return _response(200, {'data': project_service.progress(identity, segments[1])})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'activity':
            limit, cursor = _pagination(_query_parameters(event))
            activities, next_cursor = project_service.activity(identity, segments[1], limit, cursor)
            return _response(200, {'data': activities, 'pagination': {'nextCursor': next_cursor, 'limit': limit}})
        if method == 'GET' and len(segments) == 5 and segments[0] == 'projects' and segments[2] == 'members' and segments[4] == 'contributions':
            return _response(200, {'data': project_service.contributions(identity, segments[1], segments[3])})
        if method == 'POST' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'completion':
            return _response(201, {'data': project_service.submit_completion(identity, segments[1])})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'projects' and segments[2] == 'completion':
            return _response(200, {'data': project_service.get_completion(identity, segments[1])})
        if method == 'POST' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'completion' and segments[3] == 'confirm':
            return _response(200, {'data': project_service.confirm_completion(identity, segments[1])})
        if method == 'POST' and len(segments) == 4 and segments[0] == 'projects' and segments[2] == 'completion' and segments[3] == 'reject':
            return _response(200, {'data': project_service.reject_completion(identity, segments[1], _request_body(event))})
        if method == 'GET' and len(segments) == 3 and segments[0] == 'users' and segments[2] in {'contributions', 'completed-projects'}:
            target_user_id = identity.user_id if segments[1] == 'me' else segments[1]
            limit, cursor = _pagination(_query_parameters(event))
            if segments[2] == 'contributions':
                data, next_cursor = project_service.user_contributions(identity, target_user_id, limit, cursor)
            else:
                data, next_cursor = project_service.completed_projects(identity, target_user_id, limit, cursor)
            return _response(200, {'data': data, 'pagination': {'nextCursor': next_cursor, 'limit': limit}})
        return _error_response(404, 'not_found', 'API route not found.')
    except UnauthorizedError:
        return _error_response(401, 'unauthorized', 'Authentication is required.')
    except ValidationError as error:
        return _error_response(400, 'invalid_request', str(error))
    except NotFoundError:
        return _error_response(404, 'not_found', 'Project not found.')
    except ForbiddenError:
        return _error_response(403, 'forbidden', 'You are not authorized to access this project.')
    except ConflictError:
        return _error_response(409, 'conflict', 'The requested operation conflicts with the current project state.')
    except InvalidCursorError:
        return _error_response(400, 'invalid_request', 'Invalid pagination cursor.')
    except RepositoryError:
        logger.exception('Project repository operation failed.')
        return _error_response(500, 'internal_error', 'The project service is temporarily unavailable.')
