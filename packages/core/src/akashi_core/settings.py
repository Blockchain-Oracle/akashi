"""Runtime settings from the environment (AKASHI_* variables)."""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class AkashiSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AKASHI_", env_file=".env", extra="ignore")

    env: str = "development"
    log_level: str = "info"
    redis_url: str | None = None
    public_base_url: str = "http://localhost:8000"
    repo_url: str = "https://github.com/Blockchain-Oracle/akashi"
    contact_email: str = "blockchainoracle.dev@gmail.com"
    openalex_api_key: SecretStr | None = None  # free key: 10x the shared keyless budget
    data_dir: str = "./data"

    @property
    def is_production(self) -> bool:
        return self.env == "production"


@lru_cache(maxsize=1)
def get_settings() -> AkashiSettings:
    return AkashiSettings()
