from io import BytesIO

import pytest

from src.projects.repository import RepositoryError
from src.profiles.repository import ProfileRepository
from src.profiles.service import MAX_PHOTO_BYTES, ProfileService
from src.shared.auth import AuthenticatedIdentity
from src.shared.validation import ValidationError
from tests.fakes import FakeTable


class FakeS3:
    def __init__(self) -> None:
        self.objects: dict[str, dict[str, object]] = {}
        self.fail_post = False
        self.fail_upload = False
        self.deleted: list[str] = []

    def generate_presigned_post(self, **kwargs):
        if self.fail_post:
            raise RuntimeError('private storage failure')
        return {'url': 'https://private-bucket.example.test', 'fields': {'key': kwargs['Key'], 'Content-Type': kwargs['Fields']['Content-Type'], 'policy': 'short-lived-policy', 'signature': 'signed'}}

    def generate_presigned_url(self, operation, *, Params, ExpiresIn):
        assert operation == 'get_object'
        assert ExpiresIn == 900
        return f"https://private-bucket.example.test/{Params['Key']}?signed=short-lived"

    def head_object(self, *, Bucket, Key):
        if self.fail_upload or Key not in self.objects:
            raise RuntimeError('missing upload')
        item = self.objects[Key]
        return {'ContentLength': len(item['body']), 'ContentType': item['type']}

    def get_object(self, *, Bucket, Key, Range):
        return {'Body': BytesIO(self.objects[Key]['body'])}

    def delete_object(self, *, Bucket, Key):
        self.deleted.append(Key)
        self.objects.pop(Key, None)


@pytest.fixture
def service():
    return ProfileService(ProfileRepository(FakeTable()), FakeS3(), 'private-profile-bucket')


def test_profile_is_created_from_verified_identity_and_missing_photo_is_empty(service):
    identity = AuthenticatedIdentity('sub-1', 'ada@example.com', 'ada@example.com', 'Ada Lovelace')
    profile = service.get_profile(identity, 'me')
    assert profile['id'] == 'sub-1'
    assert profile['fullName'] == 'Ada Lovelace'
    assert profile['photoUrl'] is None
    assert 'email' not in profile


def test_profile_edit_persists_validated_fields_and_excludes_identity_fields(service):
    identity = AuthenticatedIdentity('sub-1')
    result = service.update_profile(identity, {
        'fullName': 'Ada Lovelace', 'location': 'London', 'bio': 'Building useful software.',
        'skills': ['Python', 'Mathematics'], 'experienceLevel': 'Advanced', 'interests': ['Open source'],
        'githubUrl': 'https://github.com/ada', 'linkedinUrl': '', 'portfolioUrl': 'https://ada.example.com',
    })
    assert result['fullName'] == 'Ada Lovelace'
    assert result['skills'] == ['Python', 'Mathematics']
    assert 'PK' not in result and 'photoKey' not in result and 'email' not in result
    with pytest.raises(ValidationError, match='unsupported fields'):
        service.update_profile(identity, {'fullName': 'Other', 'userId': 'sub-2'})
    with pytest.raises(ValidationError, match='https'):
        service.update_profile(identity, {'fullName': 'Ada', 'githubUrl': 'https://evil.example/ada'})
    with pytest.raises(ValidationError, match='https'):
        service.update_profile(identity, {'fullName': 'Ada', 'portfolioUrl': 'https://token:secret@example.com/'})


def test_photo_upload_policy_validates_type_size_and_ownership(service):
    identity = AuthenticatedIdentity('sub-1')
    with pytest.raises(ValidationError):
        service.create_photo_upload(identity, {'contentType': 'image/svg+xml', 'size': 500})
    with pytest.raises(ValidationError):
        service.create_photo_upload(identity, {'contentType': ['image/png'], 'size': 500})
    with pytest.raises(ValidationError):
        service.create_photo_upload(identity, {'contentType': 'image/png', 'size': 500, 'userId': 'sub-2'})
    with pytest.raises(ValidationError):
        service.create_photo_upload(identity, {'contentType': 'image/png', 'size': MAX_PHOTO_BYTES + 1})
    upload = service.create_photo_upload(identity, {'contentType': 'image/png', 'size': 100})
    assert upload['expiresIn'] == 300
    assert upload['key'].startswith('profile-images/sub-1/')
    with pytest.raises(ValidationError, match='this account'):
        service.complete_photo_upload(AuthenticatedIdentity('sub-2'), {'key': upload['key']})


def test_photo_finalization_checks_file_signature_and_signed_read(service):
    identity = AuthenticatedIdentity('sub-1')
    upload = service.create_photo_upload(identity, {'contentType': 'image/png', 'size': 32})
    s3 = service._s3
    s3.objects[upload['key']] = {'type': 'image/png', 'body': b'\x89PNG\r\n\x1a\n' + b'0' * 20}
    profile = service.complete_photo_upload(identity, {'key': upload['key']})
    assert profile['photoUrl'].startswith('https://private-bucket.example.test/')
    assert profile['photoUrl'].endswith('?signed=short-lived')
    with pytest.raises(ValidationError, match='content does not match'):
        second = service.create_photo_upload(identity, {'contentType': 'image/jpeg', 'size': 32})
        s3.objects[second['key']] = {'type': 'image/jpeg', 'body': b'not actually a jpeg'}
        service.complete_photo_upload(identity, {'key': second['key']})


def test_failed_upload_and_photo_removal_are_safe(service):
    identity = AuthenticatedIdentity('sub-1')
    s3 = service._s3
    s3.fail_post = True
    with pytest.raises(RepositoryError, match='prepare profile photo'):
        service.create_photo_upload(identity, {'contentType': 'image/webp', 'size': 100})
    s3.fail_post = False
    with pytest.raises(ValidationError, match='could not be verified'):
        service.complete_photo_upload(identity, {'key': 'profile-images/sub-1/' + 'a' * 32 + '.webp'})
    upload = service.create_photo_upload(identity, {'contentType': 'image/webp', 'size': 20})
    s3.objects[upload['key']] = {'type': 'image/webp', 'body': b'RIFF' + b'1234' + b'WEBP' + b'content'}
    service.complete_photo_upload(identity, {'key': upload['key']})
    result = service.remove_photo(identity)
    assert result['photoUrl'] is None
    assert upload['key'] in s3.deleted
