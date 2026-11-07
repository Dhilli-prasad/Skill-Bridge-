import base64
import json
import os
from collections.abc import Mapping
from typing import Any

from src.projects.models import (
    ActivityItem, CompletionItem, ConfirmationItem, ContributionItem, InvitationItem, JoinRequestItem,
    MembershipItem, MilestoneItem, ProjectItem, TaskItem,
)


class RepositoryError(RuntimeError):
    """Raised when DynamoDB cannot complete a repository operation."""


class ConflictError(RepositoryError):
    """Raised when a conditional write detects an existing record."""


class InvalidCursorError(ValueError):
    """Raised when a pagination cursor is malformed."""


def encode_cursor(key: Mapping[str, Any] | None) -> str | None:
    if not key:
        return None
    try:
        raw = json.dumps(dict(key), separators=(',', ':'), sort_keys=True).encode('utf-8')
        return base64.urlsafe_b64encode(raw).decode('ascii').rstrip('=')
    except (TypeError, ValueError) as error:
        raise InvalidCursorError('Invalid pagination cursor.') from error


def decode_cursor(cursor: str | None) -> dict[str, Any] | None:
    if not cursor:
        return None
    try:
        padding = '=' * (-len(cursor) % 4)
        value = json.loads(base64.urlsafe_b64decode(cursor + padding).decode('utf-8'))
    except (ValueError, TypeError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise InvalidCursorError('Invalid pagination cursor.') from error
    if not isinstance(value, dict) or not all(isinstance(item, str) for item in value):
        raise InvalidCursorError('Invalid pagination cursor.')
    return value


class ProjectRepository:
    """DynamoDB access for Project Collaboration metadata records."""

    PROJECT_INDEX_PARTITION = 'PROJECTS#PUBLIC'
    JOIN_REQUEST_PREFIX = 'JOIN_REQUEST#'
    JOIN_PENDING_PREFIX = 'JOIN_PENDING#'
    INVITATION_PREFIX = 'INVITATION#'
    INVITE_PENDING_PREFIX = 'INVITE_PENDING#'
    MEMBER_PREFIX = 'MEMBER#'
    MILESTONE_PREFIX = 'MILESTONE#'
    TASK_PREFIX = 'TASK#'
    ACTIVITY_PREFIX = 'ACTIVITY#'
    COMPLETION_KEY = 'COMPLETION'
    CONFIRMATION_PREFIX = 'CONFIRMATION#'
    CONTRIBUTION_PREFIX = 'CONTRIBUTION#'

    def __init__(self, table: Any | None = None, table_name: str | None = None) -> None:
        self._table = table
        self._table_name = table_name or os.environ.get('TABLE_NAME', '')

    def _table_client(self) -> Any:
        if self._table is not None:
            return self._table
        if not self._table_name:
            raise RepositoryError('DynamoDB table configuration is missing.')
        try:
            import boto3

            self._table = boto3.resource('dynamodb').Table(self._table_name)
            return self._table
        except Exception as error:
            raise RepositoryError('DynamoDB is unavailable.') from error

    @staticmethod
    def _is_conditional_conflict(error: Exception) -> bool:
        response = getattr(error, 'response', {})
        if not isinstance(response, Mapping):
            return False
        details = response.get('Error')
        return isinstance(details, Mapping) and details.get('Code') in {
            'ConditionalCheckFailedException', 'TransactionCanceledException',
        }

    @staticmethod
    def _condition_expression_values(values: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
        def marshal(value: Any) -> dict[str, Any]:
            if isinstance(value, bool):
                return {'BOOL': value}
            if isinstance(value, str):
                return {'S': value}
            if isinstance(value, int):
                return {'N': str(value)}
            if value is None:
                return {'NULL': True}
            if isinstance(value, list):
                return {'L': [marshal(item) for item in value]}
            if isinstance(value, dict):
                return {'M': {key: marshal(item) for key, item in value.items()}}
            raise TypeError('Unsupported DynamoDB value.')
        return {key: marshal(value) for key, value in values.items()}

    def _transact_write(self, operations: list[dict[str, Any]]) -> None:
        table = self._table_client()
        direct = getattr(table, 'transact_write_items', None)
        try:
            if callable(direct):
                direct(TransactItems=operations)
                return
            client = getattr(getattr(table, 'meta', None), 'client', None)
            if client is None:
                raise RepositoryError('DynamoDB transactions are unavailable.')
            low_level: list[dict[str, Any]] = []
            for operation in operations:
                converted = dict(operation)
                kind = next(iter(operation))
                details = dict(operation[kind])
                details['TableName'] = self._table_name
                if 'Item' in details:
                    details['Item'] = self._condition_expression_values(details['Item'])
                if 'Key' in details:
                    details['Key'] = self._condition_expression_values(details['Key'])
                if 'ExpressionAttributeValues' in details:
                    details['ExpressionAttributeValues'] = self._condition_expression_values(details['ExpressionAttributeValues'])
                converted[kind] = details
                low_level.append(converted)
            client.transact_write_items(TransactItems=low_level)
        except Exception as error:
            if isinstance(error, RepositoryError):
                raise
            if self._is_conditional_conflict(error):
                raise ConflictError('The requested state change conflicts with another update.') from error
            raise RepositoryError('Unable to complete the transaction.') from error

    def create_project(self, item: ProjectItem, activity: ActivityItem | None = None) -> ProjectItem:
        try:
            if activity:
                self._transact_write([
                    {'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}},
                    {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
                ])
            else:
                self._table_client().put_item(Item=dict(item), ConditionExpression='attribute_not_exists(PK)')
            return item
        except Exception as error:
            if self._is_conditional_conflict(error):
                raise ConflictError('Project already exists.') from error
            if isinstance(error, RepositoryError):
                raise
            raise RepositoryError('Unable to save project.') from error

    def get_project(self, project_id: str) -> ProjectItem | None:
        try:
            response = self._table_client().get_item(
                Key={'PK': f'PROJECT#{project_id}', 'SK': 'METADATA'},
            )
        except Exception as error:
            raise RepositoryError('Unable to retrieve project.') from error
        item = response.get('Item') if isinstance(response, Mapping) else None
        return dict(item) if isinstance(item, Mapping) else None

    def list_public_projects(self, limit: int, cursor: str | None = None) -> tuple[list[ProjectItem], str | None]:
        params: dict[str, Any] = {
            'IndexName': 'GSI1',
            'KeyConditionExpression': 'GSI1PK = :public_projects',
            'ExpressionAttributeValues': {':public_projects': self.PROJECT_INDEX_PARTITION},
            'Limit': limit,
        }
        start_key = decode_cursor(cursor)
        if start_key:
            params['ExclusiveStartKey'] = start_key
        try:
            response = self._table_client().query(**params)
        except InvalidCursorError:
            raise
        except Exception as error:
            raise RepositoryError('Unable to list projects.') from error
        items = response.get('Items', []) if isinstance(response, Mapping) else []
        if not isinstance(items, list):
            raise RepositoryError('Invalid project response.')
        last_key = response.get('LastEvaluatedKey') if isinstance(response, Mapping) else None
        return [dict(item) for item in items if isinstance(item, Mapping)], encode_cursor(last_key)

    def _get_item(self, key: Mapping[str, str]) -> dict[str, Any] | None:
        try:
            response = self._table_client().get_item(Key=dict(key))
        except Exception as error:
            raise RepositoryError('Unable to retrieve project collaboration data.') from error
        item = response.get('Item') if isinstance(response, Mapping) else None
        return dict(item) if isinstance(item, Mapping) else None

    def get_join_request(self, project_id: str, request_id: str) -> JoinRequestItem | None:
        return self._get_item({'PK': f'PROJECT#{project_id}', 'SK': f'{self.JOIN_REQUEST_PREFIX}{request_id}'})

    def list_join_requests(self, project_id: str) -> list[JoinRequestItem]:
        return self._list_project_items(project_id, self.JOIN_REQUEST_PREFIX)

    def create_join_request(self, item: JoinRequestItem) -> JoinRequestItem:
        project_id = item['projectId']
        requester_id = item['requesterId']
        self._transact_write([
            {'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': {
                'PK': f'PROJECT#{project_id}', 'SK': f'{self.JOIN_PENDING_PREFIX}{requester_id}',
                'entityType': 'join_pending', 'requestId': item['id'],
            }, 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])
        return item

    def review_join_request(self, project: ProjectItem, request: JoinRequestItem, action: str, now: str, activity: ActivityItem | None = None) -> None:
        project_id = request['projectId']
        requester_id = request['requesterId']
        request_key = {'PK': f'PROJECT#{project_id}', 'SK': f'{self.JOIN_REQUEST_PREFIX}{request["id"]}'}
        pending_key = {'PK': f'PROJECT#{project_id}', 'SK': f'{self.JOIN_PENDING_PREFIX}{requester_id}'}
        if action == 'reject':
            operations: list[dict[str, Any]] = [
                {'Update': {'Key': request_key, 'UpdateExpression': 'SET #status = :status, updatedAt = :now',
                            'ConditionExpression': '#status = :pending',
                            'ExpressionAttributeNames': {'#status': 'status'},
                            'ExpressionAttributeValues': {':status': 'rejected', ':pending': 'pending', ':now': now}}},
                {'Delete': {'Key': pending_key}},
            ]
            if activity:
                operations.append({'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}})
            self._transact_write(operations)
            return
        member = {'PK': f'PROJECT#{project_id}', 'SK': f'{self.MEMBER_PREFIX}{requester_id}',
                  'entityType': 'membership', 'projectId': project_id, 'userId': requester_id,
                  'role': request['role'], 'joinedAt': now}
        operations = [
            {'Put': {'Item': member, 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Update': {'Key': {'PK': f'PROJECT#{project_id}', 'SK': 'METADATA'},
                        'UpdateExpression': 'SET memberCount = if_not_exists(memberCount, :zero) + :one, updatedAt = :now',
                        'ConditionExpression': '#status = :recruiting AND if_not_exists(memberCount, :zero) < capacity',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':zero': 0, ':one': 1, ':now': now, ':recruiting': 'Recruiting'}}},
            {'Update': {'Key': request_key, 'UpdateExpression': 'SET #status = :status, updatedAt = :now',
                        'ConditionExpression': '#status = :pending',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':status': 'approved', ':pending': 'pending', ':now': now}}},
            {'Delete': {'Key': pending_key}},
        ]
        if activity:
            operations.append({'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}})
        self._transact_write(operations)

    def get_invitation(self, project_id: str, invitation_id: str) -> InvitationItem | None:
        return self._get_item({'PK': f'PROJECT#{project_id}', 'SK': f'{self.INVITATION_PREFIX}{invitation_id}'})

    def list_invitations(self, project_id: str) -> list[InvitationItem]:
        return self._list_project_items(project_id, self.INVITATION_PREFIX)

    def create_invitation(self, item: InvitationItem) -> InvitationItem:
        project_id = item['projectId']
        invitee_id = item['inviteeId']
        self._transact_write([
            {'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': {
                'PK': f'PROJECT#{project_id}', 'SK': f'{self.INVITE_PENDING_PREFIX}{invitee_id}',
                'entityType': 'invite_pending', 'invitationId': item['id'],
            }, 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])
        return item

    def respond_invitation(self, project: ProjectItem, invitation: InvitationItem, action: str, now: str, activity: ActivityItem | None = None) -> None:
        project_id = invitation['projectId']
        invitee_id = invitation['inviteeId']
        invitation_key = {'PK': f'PROJECT#{project_id}', 'SK': f'{self.INVITATION_PREFIX}{invitation["id"]}'}
        pending_key = {'PK': f'PROJECT#{project_id}', 'SK': f'{self.INVITE_PENDING_PREFIX}{invitee_id}'}
        if action == 'decline':
            operations: list[dict[str, Any]] = [
                {'Update': {'Key': invitation_key, 'UpdateExpression': 'SET #status = :status, updatedAt = :now',
                            'ConditionExpression': '#status = :pending',
                            'ExpressionAttributeNames': {'#status': 'status'},
                            'ExpressionAttributeValues': {':status': 'declined', ':pending': 'pending', ':now': now}}},
                {'Delete': {'Key': pending_key}},
            ]
            if activity:
                operations.append({'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}})
            self._transact_write(operations)
            return
        member = {'PK': f'PROJECT#{project_id}', 'SK': f'{self.MEMBER_PREFIX}{invitee_id}',
                  'entityType': 'membership', 'projectId': project_id, 'userId': invitee_id,
                  'role': invitation['role'], 'joinedAt': now}
        operations = [
            {'Put': {'Item': member, 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Update': {'Key': {'PK': f'PROJECT#{project_id}', 'SK': 'METADATA'},
                        'UpdateExpression': 'SET memberCount = if_not_exists(memberCount, :zero) + :one, updatedAt = :now',
                        'ConditionExpression': '#status = :recruiting AND if_not_exists(memberCount, :zero) < capacity',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':zero': 0, ':one': 1, ':now': now, ':recruiting': 'Recruiting'}}},
            {'Update': {'Key': invitation_key, 'UpdateExpression': 'SET #status = :status, updatedAt = :now',
                        'ConditionExpression': '#status = :pending',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':status': 'accepted', ':pending': 'pending', ':now': now}}},
            {'Delete': {'Key': pending_key}},
        ]
        if activity:
            operations.append({'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}})
        self._transact_write(operations)

    def list_members(self, project_id: str) -> list[MembershipItem]:
        return self._list_project_items(project_id, self.MEMBER_PREFIX)

    def list_activity(self, project_id: str, limit: int, cursor: str | None = None) -> tuple[list[ActivityItem], str | None]:
        return self._query_project_items(project_id, self.ACTIVITY_PREFIX, limit=limit, cursor=cursor)

    def get_completion(self, project_id: str) -> CompletionItem | None:
        return self._get_item({'PK': f'PROJECT#{project_id}', 'SK': self.COMPLETION_KEY})

    def list_confirmations(self, project_id: str) -> list[ConfirmationItem]:
        return self._list_project_items(project_id, self.CONFIRMATION_PREFIX)

    def list_contributions(self, project_id: str) -> list[ContributionItem]:
        return self._list_project_items(project_id, self.CONTRIBUTION_PREFIX)

    def list_user_contributions(self, user_id: str, limit: int, cursor: str | None = None) -> tuple[list[ContributionItem], str | None]:
        params: dict[str, Any] = {
            'IndexName': 'GSI1',
            'KeyConditionExpression': 'GSI1PK = :user_contributions',
            'ExpressionAttributeValues': {':user_contributions': f'USER#{user_id}#CONTRIBUTIONS'},
            'Limit': limit,
        }
        start_key = decode_cursor(cursor)
        if start_key:
            params['ExclusiveStartKey'] = start_key
        try:
            response = self._table_client().query(**params)
        except Exception as error:
            raise RepositoryError('Unable to list user contributions.') from error
        items = response.get('Items', []) if isinstance(response, Mapping) else []
        last_key = response.get('LastEvaluatedKey') if isinstance(response, Mapping) else None
        return [dict(item) for item in items if isinstance(item, Mapping)], encode_cursor(last_key)

    def create_completion(self, completion: CompletionItem, owner_confirmation: ConfirmationItem, activity: ActivityItem) -> CompletionItem:
        self._transact_write([
            {'Put': {'Item': dict(completion), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': dict(owner_confirmation), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])
        return completion

    def create_and_finalize_completion(
        self, project: ProjectItem, completion: CompletionItem, owner_confirmation: ConfirmationItem,
        submission_activity: ActivityItem, completed_activity: ActivityItem, contributions: list[ContributionItem],
    ) -> CompletionItem:
        project_id = project['id']
        operations: list[dict[str, Any]] = [
            {'Put': {'Item': dict(completion), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': dict(owner_confirmation), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Update': {'Key': {'PK': f'PROJECT#{project_id}', 'SK': 'METADATA'},
                        'UpdateExpression': 'SET #status = :completed, completedAt = :now, finalProgress = :progress, teamSnapshot = :team, updatedAt = :now',
                        'ConditionExpression': '#status = :active',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {
                            ':completed': 'COMPLETED', ':active': project.get('status', 'Recruiting'), ':now': completion['completedAt'],
                            ':progress': completion['progressSnapshot'], ':team': completion['teamSnapshot'],
                        }}},
            {'Put': {'Item': dict(submission_activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': dict(completed_activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ]
        operations[0]['Put']['Item']['status'] = 'COMPLETED'
        operations.extend({'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}} for item in contributions)
        self._transact_write(operations)
        return completion

    def save_confirmation(self, confirmation: ConfirmationItem) -> None:
        self._transact_write([{
            'Put': {'Item': dict(confirmation), 'ConditionExpression': 'attribute_not_exists(PK)'},
        }])

    def reject_completion(self, project_id: str, user_id: str, reason: str, now: str, activity: ActivityItem) -> None:
        self._transact_write([
            {'Update': {'Key': {'PK': f'PROJECT#{project_id}', 'SK': self.COMPLETION_KEY},
                        'UpdateExpression': 'SET #status = :rejected, rejectedAt = :now, rejectionReason = :reason',
                        'ConditionExpression': '#status = :pending',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':rejected': 'REJECTED', ':pending': 'PENDING_CONFIRMATION', ':now': now, ':reason': reason}}},
            {'Put': {'Item': {
                'PK': f'PROJECT#{project_id}', 'SK': f'{self.CONFIRMATION_PREFIX}{user_id}',
                'entityType': 'confirmation', 'projectId': project_id, 'userId': user_id,
                'status': 'REJECTED', 'reason': reason, 'createdAt': now,
            }, 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])

    def confirm_completion(
        self, project: ProjectItem, completion: CompletionItem, confirmation: ConfirmationItem,
        *, finalize: bool, contributions: list[ContributionItem], activity: ActivityItem,
    ) -> None:
        project_id = project['id']
        operations: list[dict[str, Any]] = [
            {'Put': {'Item': dict(confirmation), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ]
        if not finalize:
            self._transact_write(operations)
            return
        now = confirmation['createdAt']
        operations.extend([
            {'Update': {'Key': {'PK': f'PROJECT#{project_id}', 'SK': self.COMPLETION_KEY},
                        'UpdateExpression': 'SET #status = :completed, completedAt = :now',
                        'ConditionExpression': '#status = :pending',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':completed': 'COMPLETED', ':pending': 'PENDING_CONFIRMATION', ':now': now}}},
            {'Update': {'Key': {'PK': f'PROJECT#{project_id}', 'SK': 'METADATA'},
                        'UpdateExpression': 'SET #status = :completed, completedAt = :now, finalProgress = :progress, teamSnapshot = :team, updatedAt = :now',
                        'ConditionExpression': '#status = :active',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {
                            ':completed': 'COMPLETED', ':active': project.get('status', 'Recruiting'), ':now': now,
                            ':progress': completion['progressSnapshot'], ':team': completion['teamSnapshot'],
                        }}},
            {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])
        operations.extend({'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}} for item in contributions)
        self._transact_write(operations)

    def finalize_completion(
        self, project: ProjectItem, completion: CompletionItem, contributions: list[ContributionItem], activity: ActivityItem,
    ) -> None:
        now = completion['completedAt']
        operations: list[dict[str, Any]] = [
            {'Update': {'Key': {'PK': project['PK'], 'SK': self.COMPLETION_KEY},
                        'UpdateExpression': 'SET #status = :completed, completedAt = :now',
                        'ConditionExpression': '#status = :pending',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {':completed': 'COMPLETED', ':pending': 'PENDING_CONFIRMATION', ':now': now}}},
            {'Update': {'Key': {'PK': project['PK'], 'SK': 'METADATA'},
                        'UpdateExpression': 'SET #status = :completed, completedAt = :now, finalProgress = :progress, teamSnapshot = :team, updatedAt = :now',
                        'ConditionExpression': '#status = :active',
                        'ExpressionAttributeNames': {'#status': 'status'},
                        'ExpressionAttributeValues': {
                            ':completed': 'COMPLETED', ':active': project.get('status', 'Recruiting'), ':now': now,
                            ':progress': completion['progressSnapshot'], ':team': completion['teamSnapshot'],
                        }}} ,
            {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ]
        operations.extend({'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}} for item in contributions)
        self._transact_write(operations)

    def _list_project_items(self, project_id: str, prefix: str) -> list[dict[str, Any]]:
        items, _ = self._query_project_items(project_id, prefix, limit=1000)
        return items

    def _query_project_items(
        self, project_id: str, prefix: str, *, limit: int, cursor: str | None = None,
    ) -> tuple[list[dict[str, Any]], str | None]:
        params: dict[str, Any] = {
            'KeyConditionExpression': 'PK = :project AND begins_with(SK, :prefix)',
            'ExpressionAttributeValues': {':project': f'PROJECT#{project_id}', ':prefix': prefix},
            'Limit': limit,
        }
        start_key = decode_cursor(cursor)
        if start_key:
            params['ExclusiveStartKey'] = start_key
        try:
            response = self._table_client().query(**params)
        except Exception as error:
            raise RepositoryError('Unable to list project collaboration data.') from error
        items = response.get('Items', []) if isinstance(response, Mapping) else []
        last_key = response.get('LastEvaluatedKey') if isinstance(response, Mapping) else None
        return [dict(item) for item in items if isinstance(item, Mapping)], encode_cursor(last_key)

    def get_membership(self, project_id: str, user_id: str) -> MembershipItem | None:
        return self._get_item({'PK': f'PROJECT#{project_id}', 'SK': f'{self.MEMBER_PREFIX}{user_id}'})

    def get_milestone(self, project_id: str, milestone_id: str) -> MilestoneItem | None:
        return self._get_item({'PK': f'PROJECT#{project_id}', 'SK': f'{self.MILESTONE_PREFIX}{milestone_id}'})

    def list_milestones(self, project_id: str, limit: int, cursor: str | None = None) -> tuple[list[MilestoneItem], str | None]:
        return self._query_project_items(project_id, self.MILESTONE_PREFIX, limit=limit, cursor=cursor)

    def create_milestone(self, item: MilestoneItem, activity: ActivityItem) -> MilestoneItem:
        self._transact_write([
            {'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}},
            {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])
        return item

    def update_milestone(self, item: MilestoneItem, updates: Mapping[str, Any], activity: ActivityItem) -> MilestoneItem:
        names = {f'#{field}': field for field in updates}
        values = {f':{field}': value for field, value in updates.items()}
        assignments = ', '.join(f'#{field} = :{field}' for field in updates)
        self._transact_write([
            {'Update': {'Key': {'PK': item['PK'], 'SK': item['SK']},
                        'UpdateExpression': f'SET {assignments}',
                        'ConditionExpression': 'attribute_exists(PK) AND updatedAt = :expected',
                        'ExpressionAttributeNames': names,
                        'ExpressionAttributeValues': {**values, ':expected': item['updatedAt']}}},
            {'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ])
        result = dict(item)
        result.update(updates)
        return result

    def delete_milestone(self, item: MilestoneItem) -> None:
        self._transact_write([{
            'Delete': {'Key': {'PK': item['PK'], 'SK': item['SK']},
                       'ConditionExpression': 'attribute_exists(PK)'},
        }])

    def get_task(self, project_id: str, task_id: str) -> TaskItem | None:
        return self._get_item({'PK': f'PROJECT#{project_id}', 'SK': f'{self.TASK_PREFIX}{task_id}'})

    def list_tasks(self, project_id: str, limit: int, cursor: str | None = None) -> tuple[list[TaskItem], str | None]:
        return self._query_project_items(project_id, self.TASK_PREFIX, limit=limit, cursor=cursor)

    def list_all_tasks(self, project_id: str) -> list[TaskItem]:
        items: list[TaskItem] = []
        cursor: str | None = None
        while True:
            page, cursor = self.list_tasks(project_id, 1000, cursor)
            items.extend(page)
            if not cursor:
                return items

    def list_all_milestones(self, project_id: str) -> list[MilestoneItem]:
        items: list[MilestoneItem] = []
        cursor: str | None = None
        while True:
            page, cursor = self.list_milestones(project_id, 1000, cursor)
            items.extend(page)
            if not cursor:
                return items

    def list_all_activity(self, project_id: str) -> list[ActivityItem]:
        items: list[ActivityItem] = []
        cursor: str | None = None
        while True:
            page, cursor = self.list_activity(project_id, 1000, cursor)
            items.extend(page)
            if not cursor:
                return items

    def create_task(self, item: TaskItem, activities: list[ActivityItem], milestone: MilestoneItem | None) -> TaskItem:
        operations: list[dict[str, Any]] = [
            {'Put': {'Item': dict(item), 'ConditionExpression': 'attribute_not_exists(PK)'}},
        ]
        if milestone:
            operations.append({'ConditionCheck': {
                'Key': {'PK': milestone['PK'], 'SK': milestone['SK']},
                'ConditionExpression': '#status <> :completed',
                'ExpressionAttributeNames': {'#status': 'status'},
                'ExpressionAttributeValues': {':completed': 'COMPLETED'},
            }})
        operations.extend({'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}} for activity in activities)
        self._transact_write(operations)
        return item

    def update_task(self, item: TaskItem, updates: Mapping[str, Any], activities: list[ActivityItem]) -> TaskItem:
        names = {f'#{field}': field for field in updates}
        values = {f':{field}': value for field, value in updates.items()}
        assignments = ', '.join(f'#{field} = :{field}' for field in updates)
        self._transact_write([
            {'Update': {'Key': {'PK': item['PK'], 'SK': item['SK']},
                        'UpdateExpression': f'SET {assignments}',
                        'ConditionExpression': 'attribute_exists(PK) AND updatedAt = :expected AND #current = :current',
                        'ExpressionAttributeNames': {**names, '#current': 'status'},
                        'ExpressionAttributeValues': {**values, ':expected': item['updatedAt'], ':current': item['status']}}},
            *({'Put': {'Item': dict(activity), 'ConditionExpression': 'attribute_not_exists(PK)'}} for activity in activities),
        ])
        result = dict(item)
        result.update(updates)
        return result

    def delete_task(self, item: TaskItem) -> None:
        self._transact_write([{
            'Delete': {'Key': {'PK': item['PK'], 'SK': item['SK']},
                       'ConditionExpression': 'attribute_exists(PK) AND updatedAt = :expected',
                       'ExpressionAttributeValues': {':expected': item['updatedAt']}},
        }])
