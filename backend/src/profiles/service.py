import logging
import os
import re
from collections.abc import Mapping
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from src.projects.repository import RepositoryError
from src.shared.auth import AuthenticatedIdentity
from src.shared.validation import ValidationError, require_json_object, require_string
from src.profiles.repository import ProfileRepository

logger = logging.getLogger(__name__)
MAX_PHOTO_BYTES = 5 * 1024 * 1024
PHOTO_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}
PHOTO_SIGNATURES = {
    'image/jpeg': lambda value: value.startswith(b'\xff\xd8\xff'),
    'image/png': lambda value: value.startswith(b'\x89PNG\r\n\x1a\n'),
    'image/webp': lambda value: len(value) >= 12 and value[:4] == b'RIFF' and value[8:12] == b'WEBP',
}
EXPERIENCE_LEVELS = {'Beginner', 'Intermediate', 'Advanced', 'Expert'}
PROFILE_FIELDS = {
    'fullName', 'location', 'bio', 'skills', 'experienceLevel', 'interests',
    'githubUrl', 'linkedinUrl', 'portfolioUrl',
}
PUBLIC_FIELDS = (
    'id', 'fullName', 'location', 'bio', 'skills', 'experienceLevel',
    'interests', 'githubUrl', 'linkedinUrl', 'portfolioUrl', 'updatedAt',
)
PHOTO_KEY_PATTERN = re.compile(r'^profile-images/[A-Za-z0-9-]{1,128}/[a-f0-9]{32}\.(?:jpg|png|webp)$')


class ProfileService:
    def __init__(self, repository: ProfileRepository, s3_client: Any | None = None, bucket: str | None = None) -> None:
        self.repository = repository
        self._s3 = s3_client
        self._bucket = bucket or os.environ.get('PROFILE_PHOTO_BUCKET', '')

    def _s3_client(self) -> Any:
        if self._s3 is not None:
            return self._s3
        if not self._bucket:
            raise RepositoryError('Profile photo storage is not configured.')
        try:
            import boto3
            self._s3 = boto3.client('s3')
            return self._s3
        except Exception as error:
            raise RepositoryError('Profile photo storage is unavailable.') from error

    def _ensure_profile(self, identity: AuthenticatedIdentity) -> dict[str, Any]:
        existing = self.repository.get_profile(identity.user_id)
        if existing:
            return existing
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        name = identity.name or (identity.username if identity.username and '@' not in identity.username else '')
        return self.repository.save_profile({
            'PK': f'USER#{identity.user_id}', 'SK': 'PROFILE', 'entityType': 'profile',
            'id': identity.user_id, 'fullName': name[:80], 'location': '', 'bio': '',
            'skills': [], 'experienceLevel': 'Beginner', 'interests': [], 'updatedAt': now,
        })

    def _signed_photo_url(self, item: Mapping[str, Any]) -> str | None:
        key = item.get('photoKey')
        if not isinstance(key, str) or not PHOTO_KEY_PATTERN.fullmatch(key):
            return None
        try:
            return self._s3_client().generate_presigned_url(
                'get_object', Params={'Bucket': self._bucket, 'Key': key}, ExpiresIn=900,
            )
        except Exception as error:
            logger.warning('Could not create profile photo read URL.')
            raise RepositoryError('Profile photo is temporarily unavailable.') from error

    def _public_view(self, item: Mapping[str, Any]) -> dict[str, Any]:
        result = {field: item[field] for field in PUBLIC_FIELDS if field in item}
        result['photoUrl'] = self._signed_photo_url(item)
        return result

    def get_profile(self, identity: AuthenticatedIdentity, target_id: str) -> dict[str, Any]:
        if target_id == 'me':
            return self._public_view(self._ensure_profile(identity))
        if not isinstance(target_id, str) or not re.fullmatch(r'[A-Za-z0-9-]{1,128}', target_id):
            raise ValidationError('Profile ID is invalid.')
        item = self.repository.get_profile(target_id)
        if not item:
            return {'id': target_id, 'fullName': '', 'location': '', 'bio': '', 'skills': [], 'experienceLevel': 'Beginner', 'interests': [], 'photoUrl': None}
        return self._public_view(item)

    @staticmethod
    def _optional_url(payload: Mapping[str, Any], field: str, allowed_hosts: set[str] | None = None) -> str:
        value = payload.get(field, '')
        if value is None:
            return ''
        if not isinstance(value, str) or len(value) > 500:
            raise ValidationError(f'{field} must be a valid URL of 500 characters or fewer.')
        value = value.strip()
        if not value:
            return ''
        parsed = urlparse(value)
        host = (parsed.hostname or '').lower()
        if parsed.scheme != 'https' or not host or parsed.username or parsed.password or (allowed_hosts and not any(host == allowed or host.endswith(f'.{allowed}') for allowed in allowed_hosts)):
            raise ValidationError(f'{field} must be a secure https URL.')
        return value

    @staticmethod
    def _string_list(payload: Mapping[str, Any], field: str, maximum: int) -> list[str]:
        value = payload.get(field, [])
        if not isinstance(value, list) or len(value) > maximum or any(not isinstance(item, str) for item in value):
            raise ValidationError(f'{field} must be a list of at most {maximum} strings.')
        clean = [item.strip() for item in value if item.strip()]
        if any(len(item) > 40 for item in clean) or len({item.lower() for item in clean}) != len(clean):
            raise ValidationError(f'{field} has invalid or duplicate values.')
        return clean

    def update_profile(self, identity: AuthenticatedIdentity, payload: Any) -> dict[str, Any]:
        body = require_json_object(payload)
        if set(body) - PROFILE_FIELDS:
            raise ValidationError('Profile contains unsupported fields.')
        current = self._ensure_profile(identity)
        full_name = require_string(body, 'fullName', max_length=80)
        location = body.get('location', '')
        bio = body.get('bio', '')
        if not isinstance(location, str) or len(location.strip()) > 80:
            raise ValidationError('location must be 80 characters or fewer.')
        if not isinstance(bio, str) or len(bio.strip()) > 280:
            raise ValidationError('bio must be 280 characters or fewer.')
        experience = body.get('experienceLevel', 'Beginner')
        if not isinstance(experience, str) or experience not in EXPERIENCE_LEVELS:
            raise ValidationError('experienceLevel is invalid.')
        from datetime import datetime, timezone
        updated = {
            **current, 'fullName': full_name, 'location': location.strip(), 'bio': bio.strip(),
            'skills': self._string_list(body, 'skills', 20),
            'experienceLevel': experience,
            'interests': self._string_list(body, 'interests', 20),
            'githubUrl': self._optional_url(body, 'githubUrl', {'github.com'}),
            'linkedinUrl': self._optional_url(body, 'linkedinUrl', {'linkedin.com'}),
            'portfolioUrl': self._optional_url(body, 'portfolioUrl'),
            'updatedAt': datetime.now(timezone.utc).isoformat(),
        }
        return self._public_view(self.repository.save_profile(updated))

    def create_photo_upload(self, identity: AuthenticatedIdentity, payload: Any) -> dict[str, Any]:
        body = require_json_object(payload)
        content_type = body.get('contentType')
        size = body.get('size')
        if set(body) != {'contentType', 'size'} or not isinstance(content_type, str) or content_type not in PHOTO_TYPES or not isinstance(size, int) or isinstance(size, bool) or not 1 <= size <= MAX_PHOTO_BYTES:
            raise ValidationError('Photo must be a JPG, PNG, or WebP image no larger than 5 MB.')
        extension = PHOTO_TYPES[content_type]
        key = f'profile-images/{identity.user_id}/{uuid4().hex}.{extension}'
        try:
            result = self._s3_client().generate_presigned_post(
                Bucket=self._bucket, Key=key,
                Fields={'Content-Type': content_type},
                Conditions=[{'Content-Type': content_type}, ['content-length-range', 1, MAX_PHOTO_BYTES]],
                ExpiresIn=300,
            )
        except Exception as error:
            logger.warning('Could not create profile photo upload URL.')
            raise RepositoryError('Could not prepare profile photo upload.') from error
        return {'key': key, 'url': result['url'], 'fields': result['fields'], 'expiresIn': 300}

    def complete_photo_upload(self, identity: AuthenticatedIdentity, payload: Any) -> dict[str, Any]:
        body = require_json_object(payload)
        key = require_string(body, 'key', max_length=256)
        if set(body) != {'key'} or not PHOTO_KEY_PATTERN.fullmatch(key) or not key.startswith(f'profile-images/{identity.user_id}/'):
            raise ValidationError('Photo object key is invalid for this account.')
        try:
            metadata = self._s3_client().head_object(Bucket=self._bucket, Key=key)
        except Exception as error:
            logger.warning('Uploaded profile photo could not be verified.')
            raise ValidationError('Uploaded photo could not be verified. Please retry the upload.') from error
        content_length = metadata.get('ContentLength')
        content_type = metadata.get('ContentType')
        if not isinstance(content_length, int) or isinstance(content_length, bool) or content_length > MAX_PHOTO_BYTES or content_length < 1 or not isinstance(content_type, str) or content_type not in PHOTO_TYPES:
            try:
                self._s3_client().delete_object(Bucket=self._bucket, Key=key)
            finally:
                raise ValidationError('Uploaded photo did not meet the file requirements.')
        expected_extension = PHOTO_TYPES[content_type]
        if not key.endswith(f'.{expected_extension}'):
            raise ValidationError('Uploaded photo type does not match its file key.')
        try:
            content = self._s3_client().get_object(Bucket=self._bucket, Key=key, Range='bytes=0-15')['Body'].read(16)
        except Exception as error:
            logger.warning('Uploaded profile photo content could not be verified.')
            raise ValidationError('Uploaded photo could not be verified. Please retry the upload.') from error
        if not PHOTO_SIGNATURES[content_type](content):
            try:
                self._s3_client().delete_object(Bucket=self._bucket, Key=key)
            finally:
                raise ValidationError('Uploaded photo content does not match its declared image type.')
        profile = self._ensure_profile(identity)
        old_key = profile.get('photoKey')
        profile['photoKey'] = key
        from datetime import datetime, timezone
        profile['updatedAt'] = datetime.now(timezone.utc).isoformat()
        saved = self.repository.save_profile(profile)
        if isinstance(old_key, str) and old_key != key and PHOTO_KEY_PATTERN.fullmatch(old_key):
            try:
                self._s3_client().delete_object(Bucket=self._bucket, Key=old_key)
            except Exception:
                logger.warning('Could not remove replaced profile photo.')
        return self._public_view(saved)

    def remove_photo(self, identity: AuthenticatedIdentity) -> dict[str, Any]:
        profile = self._ensure_profile(identity)
        old_key = profile.pop('photoKey', None)
        from datetime import datetime, timezone
        profile['updatedAt'] = datetime.now(timezone.utc).isoformat()
        saved = self.repository.save_profile(profile)
        if isinstance(old_key, str) and PHOTO_KEY_PATTERN.fullmatch(old_key) and old_key.startswith(f'profile-images/{identity.user_id}/'):
            try:
                self._s3_client().delete_object(Bucket=self._bucket, Key=old_key)
            except Exception:
                logger.warning('Could not remove profile photo object.')
        return self._public_view(saved)

    def get_profiles(self, identity: AuthenticatedIdentity, ids: list[str]) -> list[dict[str, Any]]:
        if len(ids) > 50 or any(not re.fullmatch(r'[A-Za-z0-9-]{1,128}', item) for item in ids):
            raise ValidationError('At most 50 valid profile IDs may be requested.')
        return [self.get_profile(identity, item) for item in dict.fromkeys(ids)]
