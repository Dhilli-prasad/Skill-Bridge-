import pytest

from src.shared.validation import ValidationError, require_json_object, require_string


def test_require_string_trims_valid_input() -> None:
    assert require_string({"title": "  Hello  "}, "title") == "Hello"


def test_require_string_rejects_empty_input() -> None:
    with pytest.raises(ValidationError):
        require_string({"title": " "}, "title")


def test_require_json_object_rejects_lists() -> None:
    with pytest.raises(ValidationError):
        require_json_object([])
