import os
from collections.abc import Mapping
from typing import Any

from src.projects.repository import RepositoryError


class ProfileRepository:
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

    def get_profile(self, user_id: str) -> dict[str, Any] | None:
        try:
            response = self._table_client().get_item(Key={'PK': f'USER#{user_id}', 'SK': 'PROFILE'})
        except Exception as error:
            raise RepositoryError('Unable to retrieve profile.') from error
        item = response.get('Item') if isinstance(response, Mapping) else None
        return dict(item) if isinstance(item, Mapping) else None

    def save_profile(self, item: Mapping[str, Any]) -> dict[str, Any]:
        try:
            self._table_client().put_item(Item=dict(item))
        except Exception as error:
            raise RepositoryError('Unable to save profile.') from error
        return dict(item)
