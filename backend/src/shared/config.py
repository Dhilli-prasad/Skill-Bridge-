from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    environment: str
    table_name: str
    files_bucket_name: str
    allowed_origin: str


def load_settings() -> Settings:
    """Load deployment-provided configuration without accepting secrets from requests."""
    return Settings(
        environment=os.environ.get("ENVIRONMENT", "dev"),
        table_name=os.environ.get("TABLE_NAME", ""),
        files_bucket_name=os.environ.get("FILES_BUCKET_NAME", ""),
        allowed_origin=os.environ.get("ALLOWED_ORIGIN", "http://127.0.0.1:5173"),
    )
