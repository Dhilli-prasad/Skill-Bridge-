from collections.abc import Mapping
from typing import Any


class FakeConditionalError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.response = {'Error': {'Code': code}}


class FakeTable:
    def __init__(self) -> None:
        self.items: dict[tuple[str, str], dict[str, Any]] = {}
        self.failure: Exception | None = None

    def put_item(self, *, Item: Mapping[str, Any], ConditionExpression: str | None = None) -> None:
        if self.failure:
            raise self.failure
        item = dict(Item)
        key = (str(item['PK']), str(item['SK']))
        if ConditionExpression and key in self.items:
            raise FakeConditionalError('ConditionalCheckFailedException')
        self.items[key] = item

    def get_item(self, *, Key: Mapping[str, Any]) -> dict[str, Any]:
        if self.failure:
            raise self.failure
        item = self.items.get((str(Key['PK']), str(Key['SK'])))
        return {'Item': dict(item)} if item else {}

    def query(self, **kwargs: Any) -> dict[str, Any]:
        if self.failure:
            raise self.failure
        values = kwargs['ExpressionAttributeValues']
        if ':public_projects' in values or ':user_contributions' in values:
            partition_key = ':public_projects' if ':public_projects' in values else ':user_contributions'
            partition = values[partition_key]
            items = sorted(
                [item for item in self.items.values() if item.get('GSI1PK') == partition],
                key=lambda item: item.get('GSI1SK', ''),
            )
        else:
            partition = values[':project']
            prefix = values[':prefix']
            items = sorted(
                [item for item in self.items.values() if item.get('PK') == partition and str(item.get('SK', '')).startswith(prefix)],
                key=lambda item: item.get('SK', ''),
            )
        start = kwargs.get('ExclusiveStartKey')
        if start:
            start_key = (str(start['PK']), str(start['SK']))
            positions = [index for index, item in enumerate(items) if (item['PK'], item['SK']) == start_key]
            if positions:
                items = items[positions[0] + 1:]
        limit = int(kwargs.get('Limit', len(items) or 1))
        page = items[:limit]
        response: dict[str, Any] = {'Items': [dict(item) for item in page]}
        if len(items) > limit and page:
            last = page[-1]
            response['LastEvaluatedKey'] = {'PK': last['PK'], 'SK': last['SK']}
        return response

    def transact_write_items(self, *, TransactItems: list[dict[str, Any]]) -> None:
        if self.failure:
            raise self.failure
        working = {key: dict(value) for key, value in self.items.items()}

        def key_for(value: Mapping[str, Any]) -> tuple[str, str]:
            return str(value['PK']), str(value['SK'])

        def values(operation: Mapping[str, Any]) -> Mapping[str, Any]:
            return operation.get('ExpressionAttributeValues', {})

        def condition_passes(item: Mapping[str, Any] | None, operation: Mapping[str, Any]) -> bool:
            expression = operation.get('ConditionExpression', '')
            if not expression:
                return True
            if 'attribute_not_exists(PK)' in expression:
                return item is None
            if 'attribute_exists(PK)' in expression and item is None:
                return False
            attrs = values(operation)
            status_name = operation.get('ExpressionAttributeNames', {}).get('#status', 'status')
            if '#status' in expression and ':pending' in attrs and (item is None or item.get(status_name) != attrs.get(':pending')):
                return False
            if '#status' in expression and ':active' in attrs and (item is None or item.get(status_name) != attrs.get(':active')):
                return False
            if '#status' in expression and ':completed' in attrs and (item is None or item.get(status_name) == attrs.get(':completed')):
                return False
            if '#current' in expression and (item is None or item.get('status') != attrs.get(':current')):
                return False
            if ':expected' in attrs and (item is None or item.get('updatedAt') != attrs.get(':expected')):
                return False
            if 'memberCount' in expression:
                if item is None or item.get(status_name) != attrs.get(':recruiting'):
                    return False
                return int(item.get('memberCount', attrs.get(':zero', 0))) < int(item.get('capacity', 0))
            return True

        for operation in TransactItems:
            kind = next(iter(operation))
            detail = operation[kind]
            key_value = detail.get('Key') or detail.get('Item')
            current = working.get(key_for(key_value)) if key_value else None
            if not condition_passes(current, detail):
                raise FakeConditionalError('TransactionCanceledException')

        for operation in TransactItems:
            kind = next(iter(operation))
            detail = operation[kind]
            if kind == 'Put':
                item = dict(detail['Item'])
                working[key_for(item)] = item
            elif kind == 'Delete':
                working.pop(key_for(detail['Key']), None)
            elif kind == 'ConditionCheck':
                continue
            elif kind == 'Update':
                key = key_for(detail['Key'])
                item = dict(working[key])
                attrs = values(detail)
                names = detail.get('ExpressionAttributeNames', {})
                status_name = names.get('#status', 'status')
                if ':status' in attrs:
                    item[status_name] = attrs[':status']
                if ':now' in attrs:
                    item['updatedAt'] = attrs[':now']
                if ':one' in attrs:
                    item['memberCount'] = int(item.get('memberCount', attrs.get(':zero', 0))) + int(attrs[':one'])
                expression = detail.get('UpdateExpression', '')
                if expression.startswith('SET '):
                    for assignment in expression[4:].split(', '):
                        if '=' not in assignment:
                            continue
                        name, value_name = [part.strip() for part in assignment.split('=')]
                        field = names.get(name, name.lstrip('#'))
                        if value_name in attrs:
                            item[field] = attrs[value_name]
                working[key] = item
        self.items = working
